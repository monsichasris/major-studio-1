// Smithsonian API example code
// check API documentation for search here: http://edan.si.edu/openaccess/apidocs/#api-search-search

// put your API key here;
const apiKey = "OBP6w8aw6IMti0Ip1efxd3z10OzeDyxqXVcRSCOK";

// search base URL
// const searchBaseURL = "https://api.si.edu/openaccess/api/v1.0/search";
// const searchBaseURL = "https://api.si.edu/openaccess/api/v1.0/category/art_design/search";

// Constructing the search query
// const search = `topic:"Cats" AND online_media_type:"Images"`;

// const searchBaseURL =
//   "https://api.si.edu/openaccess/api/v1.0/category/art_design/search";
// const search = `topic:"Dogs" AND online_media_type:"Images"`;

const searchBaseURL =
  "https://api.si.edu/openaccess/api/v1.0/category/art_design/search";
const search = `topic:"Cats" AND online_media_type:"Images"`;

//https://collections.si.edu/search/results.htm?view=grid&fq=online_media_type%3A%22Images%22&q=dog&media.CC0=true&gfq=CSILP_4


// search: fetches an array of terms based on term category
function fetchSearchData(searchTerm) {
  let url = searchBaseURL + "?api_key=" + apiKey + "&q=" + searchTerm;
  console.log(url);
  window
    .fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log(data);
    })
    .catch(error => {
      console.log(error);
    })
}

fetchSearchData(search);