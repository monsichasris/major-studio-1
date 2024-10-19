


d3.json('data/data_women.json').then(function(dataWomen) {
        analyseData(dataWomen, "women");
    }).catch(function(error) {
        console.error('Error loading the women JSON data:', error);
    });


let sitter_count, datum, current_usable_object, people_data = [], realm_data, role_data;
function analyseData(data, datasetType) 
{
    // going through each portrait
    for (let i = 0; i < data.length; i++) 
        {
        datum = data[i];
        //going through each sitter in an individual datum
       
        for (let j = 0; j < datum.sitter.length; j++) {
            sitter_count= d3.rollup(
                datum.sitter,
                v => v.length,
                d => d.substring(0, datum.sitter[j].indexOf(':')))
             
            if(sitter_count.size==1)
            {
                //its adding it until it finds a different name. it should add it if it only has one name
            let name = datum.sitter[j].substring(0, datum.sitter[j].indexOf(':'))
            let realm = datum.sitter[j].substring(datum.sitter[j].indexOf(':') + 2, datum.sitter[j].indexOf('\\'));
            let role = datum.sitter[j].substring(datum.sitter[j].lastIndexOf('\\') + 1, datum.sitter[j].length);
            //we only want it if it has a date
            if(datum.date)
                {
                    
                    current_usable_object = 
                    {
                            "name": name,
                            "realm": realm,
                            "role": role,
                            "id": datum.id,
                            "date": datum.date
                    }
                    people_data.push(current_usable_object);
                   
                    
                };

            }
            
            } 
        } 
        console.log(people_data)    
       mapData(people_data);
 }
    
 
   
 function mapData(data) {
    let realm_data = new Map();  // Initialize the Map
    let peopleInRealm =[];//create of 16
    let realms =["arts and culture", "Medicine",  ]
    //goes through each datapoint
    for (let i = 0; i < data.length; i++) {
        let realm = data[i].realm;  // Extract the realm from the data object
        let name = data[i].name;
        for(j=0; j<realms.length; j++)//go through an array of the string names of the realms, and check it against the current realm so that we have an index for the peopleInRealm array
        {
            //peopleInRealm[j] should be equal to all the people in the realm at realms[j]
            peopleInRealm[j]
        }
        if (realm_data.has(realm) && !(peopleInRealm[].includes(name)))//check if this realm has this person counted only once) {
            // If the realm already exists, increment the count
            //and the name is unique for this realm--this is the part that I need to add i
            realm_data.set(realm, realm_data.get(realm) + 1);
            console.log(name)
        } else {
            // If the realm doesn't exist, add it with a count of 1
            realm_data.set(realm, 1);
            //and add the name in the name array
            peopleInRealm.push(name);
            console.log("people in realm")
            console.log(peopleInRealm)
        }
    }

    console.log(realm_data);  // Logs the realm and its count
}







