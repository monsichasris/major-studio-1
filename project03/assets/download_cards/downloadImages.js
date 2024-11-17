const fs = require('fs-extra');  // To handle file operations
const axios = require('axios');  // To handle HTTP requests, including redirects
const path = require('path');

// Load JSON file
const data = require('./greeting-cards.json'); // Replace with your actual JSON file path

// Define the download folder
// Make sure this path is correct!
const downloadFolder = '/Users/monsichasris/Documents/MJS/major-studio-1/project03/download_cards/cardImgDownloads'; // Ensure correct path

// Ensure the folder exists
fs.ensureDirSync(downloadFolder);

// Function to download image, with Content-Type validation and fallback if Content-Type is undefined
async function downloadImage(url, filePath) {
    try {
        // First, make a HEAD request to get headers, especially 'Content-Type'
        let contentType;
        try {
            const headResponse = await axios.head(url, { maxRedirects: 5 });
            contentType = headResponse.headers['content-type'];
        } catch (headError) {
            console.warn(`HEAD request failed for ${url}. Proceeding with GET request.`);
        }

        // Proceed even if Content-Type is undefined
        if (contentType && !contentType.startsWith('image')) {
            throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
        }

        // Now make the GET request to download the image, following redirects
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',  // Handle the large data stream
            maxRedirects: 5          // Follow up to 5 redirects
        });

        // Pipe the response (image data) to a file
        response.data.pipe(fs.createWriteStream(filePath));

        console.log(`Downloaded: ${filePath}`);
    } catch (err) {
        console.log(`Failed to download from ${url}: ${err.message}`);
    }
}

// Function to iterate over sorted data and call downloadImage for each entry
async function downloadAllImages() {
    for (const item of sortedData) {
        const imageUrl = item.img_preview;
        const title = item.title;
        const date = item.date[0].content;

        // Create a valid filename from the title and date
        const fileName = `${date}_${title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_]/g, '')}.jpg`;
        const filePath = path.join(downloadFolder, fileName);

       

        // Download the image
        await downloadImage(imageUrl, filePath);
    }
}

// Start downloading all images
downloadAllImages();
