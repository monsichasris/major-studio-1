// categories matching attributes in the data
const order = {
    "sunny": 1,
    "cloudy": 2,
    "rainy": 3,
    "stormy": 4,
    "snowy": 5,
    "windy": 6,
    "default": Number.MAX_VALUE
}
const container = d3.select(".container")

// load data
d3.json('data/attributes.json').then(function (storm) {
    displayData(storm);
});

// display data
function displayData(data) {
    // add in new data using forEach
    data.forEach(
        (d) => {
            let attrs = d.Attr.sort((a, b) =>
                (order[a] || order.default) - (order[b] || order.default) ||
                a > b || -(a < b)
            );
            // set up avatar canvas for each person
            const name = d.Name
            const p = container.append("div")
                .attr("class", "box")
            // set up the svg for each
            const svg = p.append("div")
                .attr("class", "svg")
            // add in the svg for each person
            attrs.forEach(
                (d) => {
                    svg.append("embed") // img
                        // set the src to the img folder and the name of the attribute
                        .attr("src", "img/" + d + ".svg")
                        .attr("class", "graphic")
                }
            )
            // add label for each person
            p.append("p")
                .text(name)
        }
    )};