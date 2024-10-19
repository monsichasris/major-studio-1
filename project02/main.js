


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
    let realm_data = new Map();  // Initialize the Map to store realm counts
    let peopleInRealm = {};  // Initialize an object to store arrays of names for each realm

    // Extract unique realms from the data
    let realms = data.map(d => d.realm).filter((value, index, self) => self.indexOf(value) === index);
    console.log(realms);

    // Initialize arrays for each realm in the peopleInRealm object
    realms.forEach(realm => {
        peopleInRealm[realm] = [];
        });
    
    // Iterate through each datapoint
for (let i = 0; i < data.length; i++) {
    let realm = data[i].realm;  // Extract the realm from the data object
    let name = data[i].name;  // Extract the name from the data object
    let role = data[i].role;  // Extract the role from the data object

    // Check if the name is already counted in the current realm
    if (peopleInRealm[realm].includes(name)) {
        continue;  // Skip if the name is already counted
    }

    // Add the name to the array for the current realm
    peopleInRealm[realm].push(name);

    // Update the count and roles for the current realm in the Map
if (realm_data.has(realm)) {
    let realmInfo = realm_data.get(realm);
    realmInfo.count += 1;
    if (!realmInfo.roles.includes(role)) {
        realmInfo.roles.push(role);
    }
    if (realmInfo.roleCounts[role]) {
        realmInfo.roleCounts[role] += 1;
            } else {
                realmInfo.roleCounts[role] = 1;
    }
    realm_data.set(realm, realmInfo);
} else {
    realm_data.set(realm, { count: 1, roles: [role], roleCounts: { [role]: 1 } });
}
}

console.log(realm_data);
return realm_data;

 }