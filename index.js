const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Get the user ID from command line arguments
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as a command line argument.');
  process.exit(1);
}

// Parameters that need to be preserved
const clientId = 'yLfooVZK5emWPvRLZQlSuGTO8pof6z4t';
const appVersion = '1726736933';
const appLocale = 'en';

// API URL with the user ID and necessary parameters
let apiUrl = `https://api-v2.soundcloud.com/users/${userId}/likes?limit=24&client_id=${clientId}&app_version=${appVersion}&app_locale=${appLocale}`;

// Define the CSV writer
const csvWriter = createCsvWriter({
  path: 'soundcloud_likes.csv',
  header: [
    { id: 'title', title: 'Title' },
    { id: 'url', title: 'URL' },
  ],
});

// Initialize an empty array to collect tracks
let allTracks = [];

async function fetchLikesAndExportToCSV() {
  try {
    let nextPage = apiUrl;

    // Loop until there is no next page
    while (nextPage) {
      const response = await axios.get(nextPage);
      const data = response.data;

      // Collect tracks from the current page
      const tracks = data.collection
        .filter(item => item.track)  // Filter out items that don't have a 'track' field
        .map(item => ({
          title: item.track.title,
          url: item.track.permalink_url,
        }));

      // Add the current page's tracks to the list
      allTracks = allTracks.concat(tracks);

      // Check if there is a next page
      nextPage = data.next_href || null;

      // If there is a next page, make sure to preserve the necessary parameters
      if (nextPage) {
        const url = new URL(nextPage);
        // Append the client_id, app_version, and app_locale if they aren't already present
        if (!url.searchParams.get('client_id')) {
          url.searchParams.append('client_id', clientId);
        }
        if (!url.searchParams.get('app_version')) {
          url.searchParams.append('app_version', appVersion);
        }
        if (!url.searchParams.get('app_locale')) {
          url.searchParams.append('app_locale', appLocale);
        }
        nextPage = url.toString();  // Update nextPage with the corrected URL
      }
    }

    // Write all collected tracks to CSV
    await csvWriter.writeRecords(allTracks);
    console.log('Data successfully exported to soundcloud_likes.csv');
  } catch (error) {
    console.error('Error fetching data from SoundCloud API:', error.message);
  }
}

fetchLikesAndExportToCSV();
