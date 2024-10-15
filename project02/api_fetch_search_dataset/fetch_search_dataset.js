// Smithsonian API example code
// check API documentation for search here: http://edan.si.edu/openaccess/apidocs/#api-search-search

// put your API key here;
const apiKey = "OBP6w8aw6IMti0Ip1efxd3z10OzeDyxqXVcRSCOK";

// search base URL
const searchBaseURL = "https://api.si.edu/openaccess/api/v1.0/search";

// constructing the initial search query
// const search = `unit_code:"NPG" AND online_visual_material:true AND topic:"Men"`;
const search = `unit_code:"NPG" AND online_visual_material:true AND topic:"Women"`;

// array ole.log(data)that we will write into
let myArray = [];

// string that will hold the stringified JSON data
let jsonString = '';

// search: fetches an array of terms based on term category
function fetchSearchData(searchTerm) {
  let url = searchBaseURL + "?api_key=" + apiKey + "&q=" + searchTerm;
  console.log(url);
  window
    .fetch(url)
    .then(res => res.json())
    .then(data => {

      console.log(data);
      // constructing search queries to get all the rows of data
      // you can change the page size
      let pageSize = 1000;
      let numberOfQueries = Math.ceil(data.response.rowCount / pageSize);
      console.log(numberOfQueries)
      for (let i = 0; i < numberOfQueries; i++) {
        // making sure that our last query calls for the exact number of rows
        if (i == (numberOfQueries - 1)) {
          searchAllURL = url + `&start=${i * pageSize}&rows=${data.response.rowCount - (i * pageSize)}`;
        } else {
          searchAllURL = url + `&start=${i * pageSize}&rows=${pageSize}`;
        }
        console.log(searchAllURL)
        fetchAllData(searchAllURL);

      }
    })
    .catch(error => {
      console.log(error);
    })
}

// fetching all the data listed under our search and pushing them all into our custom array
function fetchAllData(url) {
  window
    .fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log(data)

      data.response.rows.forEach(function (n) {
        addObject(n);
      });
      jsonString += JSON.stringify(myArray);
      console.log(myArray);
    })
    .catch(error => {
      console.log(error)
    })

}

// create your own array with just the data you need

var usable_topics=[], current_topic;
function addObject(objectData) {
  usable_topics=[];
  // need to check if it has men or women in the topic but to traverse it I need a loop
  for(i=0; i<objectData.content.freetext.topic.length; i++){
    //current topic is a string
    current_topic= objectData.content.freetext.topic[i].content;
   
    //check if in each of these there is  a colon and a \\ , and only add those
   if (current_topic.includes(":") && current_topic.includes("\\")){
    
    //it needs to happen for every unique objectdata
    usable_topics.push(current_topic);
   }
  }
  console.log(usable_topics)
    // if usable topics has at least one career in it, only then add it so that we can reduce our data and make it easier to download
    if(usable_topics[0]){
      myArray.push({
    id: objectData.id,
    title: objectData.title,
    link: objectData.content.descriptiveNonRepeating.record_link,
    topic: objectData.content.indexedStructured.topic,
    date: objectData.content.indexedStructured.date,
    //for the treemap topic and role
    sitter: usable_topics,
    thumbnail: objectData.content.descriptiveNonRepeating.online_media.media[0].thumbnail
  })
  }  
}


fetchSearchData(search);

//---------------------------UNIT CODES------------------------------
// ACAH: Archives Center, National Museum of American History
// ACM: Anacostia Community Museum
// CFCHFOLKLIFE: Smithsonian Center for Folklife and Cultural Heritage
// CHNDM: Cooper-Hewitt, National Design Museum
// FBR: Smithsonian Field Book Project
// FSA: Freer Gallery of Art and Arthur M. Sackler Gallery Archives
// FSG: Freer Gallery of Art and Arthur M. Sackler Gallery
// HAC: Smithsonian Gardens
// HMSG: Hirshhorn Museum and Sculpture Garden
// HSFA: Human Studies Film Archives
// NAA: National Anthropological Archives
// NASM: National Air and Space Museum
// NMAAHC: National Museum of African American History and Culture
// NMAfA: Smithsonian National Museum of African Art
// NMAH: Smithsonian National Museum of American History
// NMAI: National Museum of the American Indian
// NMNHANTHRO: NMNH - Anthropology Dept.
// NMNHBIRDS: NMNH - Vertebrate Zoology - Birds Division
// NMNHBOTANY: NMNH - Botany Dept.
// NMNHEDUCATION: NMNH - Education & Outreach
// NMNHENTO: NMNH - Entomology Dept.
// NMNHFISHES: NMNH - Vertebrate Zoology - Fishes Division
// NMNHHERPS: NMNH - Vertebrate Zoology - Herpetology Division
// NMNHINV: NMNH - Invertebrate Zoology Dept.
// NMNHMAMMALS: NMNH - Vertebrate Zoology - Mammals Division
// NMNHMINSCI: NMNH - Mineral Sciences Dept.
// NMNHPALEO: NMNH - Paleobiology Dept.
// NPG: National Portrait Gallery
// NPM: National Postal Museum
// SAAM: Smithsonian American Art Museum
// SI: Smithsonian Institution, Digitization Program Office
// SIA: Smithsonian Institution Archives
// SIL: Smithsonian Libraries