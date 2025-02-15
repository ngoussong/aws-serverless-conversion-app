import { S3Client, GetObjectCommand, PutObjectCommand, WriteGetObjectResponseCommand  } from "@aws-sdk/client-s3";
import { PDFDocument, rgb, degrees } from "pdf-lib";

import axios from 'axios';
import fs from 'fs';
import { exec, execSync } from 'child_process';
import util from 'util';
import path from 'path';
import zlib from 'zlib';
import * as tar from 'tar';

const execPromise =  util.promisify(exec);

const s3Client = new S3Client({ region: "eu-central-1" });
const SOURCE_BUCKET = 'frankfurt-s3-non-converted-documents';
const DESTINATION_BUCKET = 'frankfurt-s3-converted-documents';

// Set paths for LibreOffice binary and the archive
const LO_ARCHIVE_PATH = '/opt/lo.tar.br';
const LO_UNPACK_DIR = '/tmp/libreoffice';
const SOFFICE_BIN_PATH = path.join(LO_UNPACK_DIR, 'instdir/program/soffice.bin');

export const handler = async (event, context) => {
    try {

        // Get the original file from S3
        const { userRequest, getObjectContext } = event;
        const { outputRoute, outputToken, inputS3Url } = getObjectContext;

        const authHeader = event.headers;
        
        const presignedResponse = await axios.get(inputS3Url, { responseType: 'arraybuffer' });
        const fileBuffer = presignedResponse.data;

        console.info("Validating file type...");
        if (!checkIfPDF(fileBuffer)) {
            console.error("The file is not a valid PDF.");
            // throw new Error("Invalid file type");
        }

        // Save the downloaded file temporarily in Lambda's /tmp directory
        const tempInputPath = '/tmp/output-document.docx';
        const tempOutputPath = '/tmp/output-document.pdf';
        try {
            fs.writeFileSync(tempInputPath, fileBuffer);
            console.info("File written to /tmp successfully.");
        } catch (error) {
            console.error("Error writing to /tmp:", error.message);
            throw error;
        }

        let pdfBytes = fileBuffer;

        if (!checkIfPDF(fileBuffer)) {
             // Check if the file exists before conversion
            if (!fs.existsSync(tempInputPath)) {
                console.error("Input file does not exist:", tempInputPath);
                throw new Error("Input file does not exist: " + tempInputPath);
            }
            
            const outputPath = await convertToPDF(tempInputPath, tempOutputPath);

            pdfBytes = fs.readFileSync(outputPath);
            if (!checkIfPDF(pdfBytes)) {
                console.error("Conversion failed.");
                throw new Error("Converted file is not a PDF.");
            }
        } 

        // Convert and watermark the PDF
        // Retrieve the operation context object from the event. This object indicates where the WriteGetObjectResponse request
        // should be delivered and contains a presigned URL in 'inputS3Url' where we can download the requested object from.
        // The 'userRequest' object has information related to the user who made this 'GetObject' request to S3 Object Lambda.
        console.info("Processing PDF for watermarking...");
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
            const { width, height } = page.getSize();
            page.drawText("WATERMARK_TEXT", {
                x: width / 4,
                y: height / 2,
                size: 50,
                color: rgb(0.95, 0.1, 0.1),
                opacity: 0.3,
                rotate: degrees(45),
            });
        });

        const watermarkedPdfBytes  = await pdfDoc.save();
        const processedKey = "testKey";
        
        const writeResponseCommand = new WriteGetObjectResponseCommand({
            RequestRoute: outputRoute,
            RequestToken: outputToken,
            Bucket: DESTINATION_BUCKET,
            Key: `converted-document-${Date.now()}.pdf`,
            Body: watermarkedPdfBytes,
            ContentType: 'application/pdf'
        });

        try {
            await s3Client.send(writeResponseCommand);
            console.info("Response sent successfully.");
        } catch (error) {
            console.error("Error sending response:", error.message);
            throw error;
        }

        //await s3Client.send(writeResponseCommand);

        return {
            statusCode: 200,
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            body: JSON.stringify({
                message: 'File successfully converted and watermarked',
                s3Location: `${DESTINATION_BUCKET}/${processedKey}`
            }),
        };

    } catch (error) {
        console.error('Error during file processing:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to process file' }),
        };
    }
};

// Helper function to check if a file is a PDF
function checkIfPDF(buffer) {
    const header = buffer.slice(0, 4).toString('utf-8');
    return header === '%PDF';
}

// Function to convert non-PDF file to PDF using LibreOffice in headless mode
async function convertToPDF(inputPath, outputPath) {
    try {
        const command = `cd /tmp 
                        libreoffice7.6 --headless --invisible --nodefault --view --nolockcheck --nologo --norestore --convert-to pdf --outdir /tmp ./output-document.docx`;
        const result = execSync(command);
        console.info("LibreOffice command output:", result);
        return outputPath;
    }
    catch (error) {
        console.error('LibreOffice failed:', error.message);
        throw error;
    }    
}  