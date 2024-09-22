let pets; // Outer pets variable
let allTypes = [];


// Load both JSON files
Promise.all([
  d3.json('data/cats_art.json'),
  d3.json('data/dogs_art.json')
])
  .then(data => {
    // Combine both arrays
    pets = [...data[0], ...data[1]];
    console.log(pets); // Check combined data
    analyzeData(pets); // Call analyzeData function
    displayData(pets); // Pass combined data to your display function

  });

// analyze the data
function analyzeData(pets) {
  let type;

  // go through the list
  pets.forEach(n => {
    type = n.type[0];
    let match = false;

    // see if their location already exists the allTypes array
    allTypes.forEach(p => {
      if (p.name == type) {
        p.count++;
        match = true;
      }
    });

    // if not create a new entry for that type
    if (!match) {
      allTypes.push({
        name: type,
        count: 1
      });
    }
  });
  console.log(allTypes);

  // sort by amount of items in the list
  allTypes.sort((a, b) => (a.count < b.count) ? 1 : -1);
  console.log(allTypes)
}

// Display the data in a chart
function displayData(pets) { // Accept pets as a parameter

  // Define dimensions for the graphic
  const width = 1400;
  const height = 700;

  const colors = {
    "Prints": 'red',
    "Graphic arts": 'blue',
    "Paintings": 'green',
    "Sculpture": 'yellow',
    "Decorative arts": 'magenta',
    "Drawings": 'orange',
    "Photographs": 'purple',
    "Exterior views": 'pink',
    "Sheet music": 'brown',
    "Folk art": 'teal',
    "Still lifes": 'cyan',
  }

  // Create an SVG container
  const svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  allTypes.forEach((d, i) => {
    svg.append('circle')
      .attr('cx', 200 + i * (allTypes[i].count + 100))
      .attr('cy', height / 2)
      .attr('r', allTypes[i].count * 5)
      .attr('fill', colors[d.name])
    // .attr('stroke', 'black')
  });

  // // Iterate over the pets array
  // pets.forEach((d, i) => {


  //   // const types = pets.filter((item) => Object.values(item)[0] === type);

  //   // for (let i = 0; i < pets.length; i++) {
  //   //   //assign color for each type
  //   // }

  //   for (let i = 0; i < pets.length; i++) {
  //     //assign the shape for each pet
  //     if (d.topic[i] === 'Cats') {
  //       svg.append('rect')
  //         .attr('x', 30)
  //         .attr('y', i * 30)
  //         .attr('width', 20)
  //         .attr('height', 20)
  //         ;
  //     } else if (d.topic[i] === 'Dogs') {
  //       svg.append('circle')
  //         .attr('cx', 70)
  //         .attr('cy', i * 30)
  //         .attr('r', 10)
  //         ;
  //     }
  //   }
  // });





}