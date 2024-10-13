
 d3.json('data/data_women.json').then(function(data) {
    // Log the data to check its structure
    console.log(data);
    analyseData(data);
 }).catch(function(error) {
    console.error('Error loading the JSON data:', error);
    
  });

people_data=[], midstage_peoplearray=[];

function analyseData(data)
{
    //exclude portraits that are groups

    //we need all data grouped by topic
     for(i=0; i<data.length; i++)
        { 
            datum =data[i];
            for(j=0; j<datum.sitter.length; j++)
            {
                //will traverse through each career in a particular data point: in each photo
                //find the first colon's index, create a substring of the word before it, that's our name.
                var name=datum.sitter[j].substring(0, datum.sitter[j].indexOf(':'));
                //find the first \\, create a substring of what's between the colon and the \\, that's our topic.
                var realm =datum.sitter[j].substring(datum.sitter[j].indexOf(':')+2, datum.sitter[j].indexOf('\\') );
                var role = datum.sitter[j].substring(datum.sitter[j].lastIndexOf('\\')+1, datum.sitter[j].length );
                current_usable_object={
                    "name": name,
                    "realm":  realm,
                    "role": role,
                    "id": datum.id,
                    "date": datum.date
                }
                people_data.push(current_usable_object);
                }
           
        }
     //we are grouping by people first, and then by realm inside each person so that we get an accurate count of the realms that each person was in.
   const groupedData = d3.group(people_data, d => d.name, d=>d.realm);
   //[{realm: name_of_realm, count: number_of_people_in_real},]

     
  const categoryCountResult = countCategories(groupedData);
  console.log(categoryCountResult);
 //console.log(groupedData)

  
}
//chatgpt

// Function to count categories
function countCategories(groupedData) {
    const categoryCounts = {};
  
    // Iterate over each person and their associated realms
    groupedData.forEach((realmMap, personName) => {
      // Iterate over each realm for the current person
      realmMap.forEach((entries, realm) => {
        // Get the number of entries for this realm
        const count = entries.length;
  
        // If the realm already exists in categoryCounts, increment its count
        if (categoryCounts[realm]) {
          categoryCounts[realm] += count;
        } else {
          // Otherwise, initialize the count for this realm
          categoryCounts[realm] = count;
        }
      });
    });
  
    // Convert categoryCounts into an array of objects as desired
    const result = Object.entries(categoryCounts).map(([realm, count]) => ({
      realm,
      count
    }));
  
    return result;
  }
  
  
