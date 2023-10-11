const axios = require("axios");
require("dotenv").config();

const v = process.env;

async function getCollectionPage(pageNum) {
  const response = await axios.get(
    `${v.DISCOGS_API_URL}/users/${v.DISCOGS_USER_NAME}/collection/folders/${v.DISCOGS_COLLECTION_FOLDER_ID}/releases`,
    {
      headers: {
        Authorization: `Discogs token=${v.DISCOGS_ACCESS_TOKEN}`,
      },
      params: {
        page: pageNum,
        per_page: v.DISCOGS_RELEASES_PER_PAGE,
      },
    }
  );
  return response.data;
}

async function getReleaseTitlesAndArtists(releases) {
  const titles = [];
  const artists = [];
  for (const release of releases) {
    const response = await axios.get(
      `${v.DISCOGS_API_URL}/releases/${release.id}`,
      {
        headers: {
          Authorization: `Discogs token=${v.DISCOGS_ACCESS_TOKEN}`,
        },
      }
    );
    titles.push(response.data.title);
    artists.push(response.data.artists.map((artist) => artist.name).join(", "));
  }
  return { titles, artists };
}

async function processCollectionPages() {
  const firstPage = await getCollectionPage(1);
  const totalPages = firstPage.pagination.pages;
  console.log(`Total number of pages: ${totalPages}`);

  let allTitles = [];
  let allArtists = [];
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    console.log(`Processing page ${pageNum}...`);
    const collectionPage = await getCollectionPage(pageNum);
    const { titles, artists } = await getReleaseTitlesAndArtists(
      collectionPage.releases
    );
    allTitles.push(...titles);
    allArtists.push(...artists);
    if (pageNum < totalPages) {
      console.log(
        `Waiting ${
          v.DISCOGS_REQUEST_DELAY_MS / 1000
        } seconds before next page...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, v.DISCOGS_REQUEST_DELAY_MS)
      );
    }
  }

  console.log(`Total number of titles: ${allTitles.length}`);

  const releaseInfo = allTitles.map((title, index) => ({
    title,
    artist: allArtists[index],
  }));
  //console.log("Release Info:", releaseInfo);
  return releaseInfo;
}

// Set up Spotify authentication headers
const clientId = v.SPOTIFY_CLIENT_ID;
const clientSecret = v.SPOTIFY_CLIENT_SECRET;
const access_token = Buffer.from(`${clientId}:${clientSecret}`).toString(
  "base64"
);
const authHeaders = {
  headers: {
    Authorization: `Bearer ${access_token}`,
  },
};

// Make the API request with authentication
async function SpotifySearch() {
  //const releaseInfo = await processCollectionPages();
  //for (const release of releaseInfo) {
  //const artist = release.artist.replace(/\s+/g, "+");
  //const album = release.title.replace(/\s+/g, "+");
  //const query = `q=%2520artist:${artist}%2520album:${album}&type=album&market=US&limit=1`;
  //console.log(`Query is: ${v.SPOTIFY_API_URL}/v1/search?${query}`);
  await axios
    .get(
      "https://api.spotify.com/v1/search?q=%2520artist%3AMac+Miller%2520album%3ACircles&type=album",
      authHeaders
    )
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error(error);
    });
}
//}

SpotifySearch();
