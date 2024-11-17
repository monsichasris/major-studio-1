// load the data
d3.json('data/greeting-cards.json').then(data => { 
    cards = data;
    console.log(cards);
    analyzeData();
    displayData();
  });