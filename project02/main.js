//refresh
// Parse the JSON string into a JavaScript object
// Parse the JSON string into a JavaScript object
 // Load the JSON data
 d3.json('data_women.json').then(function(data) {
    // Log the data to check its structure
    console.log(data);

   
  }).catch(function(error) {
    console.error('Error loading the JSON data:', error);
  });
//for (i=0; i<)