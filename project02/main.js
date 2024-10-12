
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
                console.log(datum.sitter[j]);
                //find the first colon's index, create a substring of the word before it, that's our name.
                var name=datum.sitter[j].substring(0, datum.sitter[j].indexOf(':'));
                //find the first \\, create a substring of what's between the colon and the \\, that's our topic.
                var realm =datum.sitter[j].substring(datum.sitter[j].indexOf(':')+2, datum.sitter[j].indexOf('\\') );
                var role = datum.sitter[j].substring(datum.sitter[j].lastIndexOf('\\')+1, datum.sitter[j].length );
               // console.log(name)
               // console.log(realm)
                //console.log(role)
                current_usable_object={
                    "name": name,
                    "realm":  realm,
                    "role": role,
                    "id": datum.id,
                    "date": datum.date
                }
              //  console.log(current_usable_object)
                people_data.push(current_usable_object);
                //we should have array of roles and realms--monsicha
                // array of all the ids in which the person appears has to be added.
                

               
            }
            //console.log(people_data);
            
            //people_data.push(current_usable_object);
        }
        //we are grouping by people first, and then by realm inside each person so that we get an accurate count of the realms that each person was in.
   const groupedData = d3.group(people_data, d => d.name, d=>d.realm);
   
   
   console.log(groupedData)
    //going through each object in array
    // for(i=0; i<data.length; i++)
    //     {
        
    //     }
}