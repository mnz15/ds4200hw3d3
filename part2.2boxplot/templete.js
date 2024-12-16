// Set the dimensions and margins of the graph
const margin = { top: 20, right: 30, bottom: 50, left: 50 },
    width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Create the SVG canvas
const svg = d3.select("#boxplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load and process the CSV data
d3.csv("../iris.csv").then(data => {
    console.log("Loaded data:", data);

    // Convert strings to numeric values for PetalLength and species
    data.forEach(d => {
        d.PetalLength = +d.PetalLength; // Convert PetalLength to a number
        d.Species = d.Species; // Keep Species as is
    });

    // Group the data by species and compute quartiles
    const quartilesBySpecies = d3.rollup(
        data,
        values => {
            const sorted = values.map(d => d.PetalLength).sort(d3.ascending);
            const q1 = d3.quantile(sorted, 0.25);
            const median = d3.quantile(sorted, 0.5);
            const q3 = d3.quantile(sorted, 0.75);
            const iqr = q3 - q1;
            return { q1, median, q3, iqr };
        },
        d => d.Species
    );

    // Define the scales
    const xScale = d3.scaleBand()
        .domain(Array.from(quartilesBySpecies.keys()))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PetalLength) + 1])
        .nice()
        .range([height, 0]);

    // Add X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .text("Species");

    // Add Y Axis
    svg.append("g")
        .call(d3.axisLeft(yScale))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("fill", "black")
        .text("Petal Length");

    // Draw the box plots
    quartilesBySpecies.forEach((quartiles, species) => {
        const x = xScale(species);
        const boxWidth = xScale.bandwidth();

        // Draw the box
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(quartiles.q3))
            .attr("width", boxWidth)
            .attr("height", yScale(quartiles.q1) - yScale(quartiles.q3))
            .attr("fill", "#69b3a2")
            .attr("stroke", "black");

        // Median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(quartiles.median))
            .attr("y2", yScale(quartiles.median))
            .attr("stroke", "black")
            .attr("stroke-width", 2);

        // Whiskers
        svg.append("line") // Top whisker
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quartiles.q3))
            .attr("y2", yScale(quartiles.q3 + 1.5 * quartiles.iqr))
            .attr("stroke", "black");

        svg.append("line") // Bottom whisker
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quartiles.q1))
            .attr("y2", yScale(quartiles.q1 - 1.5 * quartiles.iqr))
            .attr("stroke", "black");
    });
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});

