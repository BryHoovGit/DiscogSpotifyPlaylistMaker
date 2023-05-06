const axios = require("axios");

const DISCOGS_API_URL = "https://api.discogs.com";
const DISCOGS_ACCESS_TOKEN = "your_discogs_api_token_here";
const COLLECTION_FOLDER_ID = 0;
const RELEASES_PER_PAGE = 50;
const REQUEST_DELAY_MS = 60000;
const USER_NAME = "BruceyBear";
const spotifyApi = "https://api.spotify.com/v1/search";

async function getCollectionPage(pageNum) {
  const response = await axios.get(
    `${DISCOGS_API_URL}/users/${USER_NAME}/collection/folders/${COLLECTION_FOLDER_ID}/releases`,
    {
      headers: {
        Authorization: `Discogs token=${DISCOGS_ACCESS_TOKEN}`,
      },
      params: {
        page: pageNum,
        per_page: RELEASES_PER_PAGE,
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
      `${DISCOGS_API_URL}/releases/${release.id}`,
      {
        headers: {
          Authorization: `Discogs token=${DISCOGS_ACCESS_TOKEN}`,
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
        `Waiting ${REQUEST_DELAY_MS / 1000} seconds before next page...`
      );
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
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

async function prepSpotifySearch() {
  const releaseInfo = await processCollectionPages();
  console.log(releaseInfo);
}

prepSpotifySearch();
