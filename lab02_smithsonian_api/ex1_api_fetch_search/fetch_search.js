// Smithsonian API example code
// check API documentation for search here: http://edan.si.edu/openaccess/apidocs/#api-search-search

// put your API key here;
const apiKey = "OBP6w8aw6IMti0Ip1efxd3z10OzeDyxqXVcRSCOK";

// search base URL
const searchBaseURL = "https://api.si.edu/openaccess/api/v1.0/search";

// Constructing the search query
const search = `dog AND unit_code:"CHNDM" AND online_visual_material:true`;


// https://collections.si.edu/search/results.htm?q=Flowers&view=grid&fq=data_source%3A%22Cooper+Hewitt%2C+Smithsonian+Design+Museum%22&fq=online_media_type%3A%22Images%22&media.CC0=true&fq=object_type:%22Embroidery+%28visual+works%29%22

//https://api.si.edu/openaccess/api/v1.0/search?q=online_visual_material:true+AND+unit_code:CHNDM+”dog” &api_key=OBP6w8aw6IMti0Ip1efxd3z10OzeDyxqXVcRSCOK


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