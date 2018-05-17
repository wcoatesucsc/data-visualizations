//Width and height
var w = 1600;
var h = 900;

//Define map projection
var projection = d3.geoMercator()
// scale and center are VERY IMPORTANT, otherwise 
// Denmark doesn't appear on the canvas!
                   .scale([6500])
                   .center([11,56.8]);

//Define path generator
var path = d3.geoPath()
             .projection(projection);

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

//Define Tooltip here
/* initialize the tooltip so that we can move it around
       later */
var div = d3.select("body").append("div")
.attr("class", "tooltip")
.classed("hidden", true);

// color scale for showing population density appropriately:
// the darker the blue, the higher the population density
// colors from colorbrewer2.org
var color = d3.scaleQuantize()
.range(['rgb(255,255,217)','rgb(237,248,177)','rgb(199,233,180)','rgb(127,205,187)','rgb(65,182,196)','rgb(29,145,192)','rgb(34,94,168)','rgb(37,52,148)','rgb(8,29,88)']);


// Load in population data
d3.csv("DenmarkPopulationByRegion.csv", function(popcsv){
    
// Load in area data
    d3.csv("DenmarkAreaByRegion.csv", function(areacsv){
/*======================================================================
 *
 *  Merging data from Population and Area datasets into one 
 *  comprehensive array (regionData), calculating/storing population
 *  density while we're at it.
 *
 */
        var regionData = [];
        for(var i = 0; i < popcsv.length; i++){
            // calculate population density of each region by dividing
            // population (people) by area (square kilometers)
            let popDensity = (+popcsv[i].Population/+areacsv[i].Area);
            // store the data from our two csv files into one array
            regionData.push({region:popcsv[i].Region,
                             population:popcsv[i].Population,
                             area:areacsv[i].Area,
                             density:popDensity});
        }
/*====================================================================*/
        
/*======================================================================
 *
 *  Setting up color scale with input domain based on min/max
 *  population density
 *
 */
/*====================================================================*/
        
        
        //Load in GeoJSON data
        d3.json("Denmark.json", function(json) {
            
        // attach the proper density value to each GeoJSON features
        regionData.forEach(function(region, i){
            var dataRegionName = region.region;
            var dataDensity = parseFloat(region.density);
           
            // find the correct feature in the GeoJSON
            for (var j = 0; j < json.features.length; j++){
                var jsonRegionName = json.features[j].properties.NAME_2;
              
                if(dataRegionName == jsonRegionName){
                    // attach the density to the GeoJSON region
                    json.features[j].properties.density = dataDensity;
                    // We've matched the regions, so stop looking for this
                    // iteration
                    break;
                }
            }
           
        })  
        //Bind data and create one path per GeoJSON feature
        svg.selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
   //               .style("fill", "steelblue");
                    .style("stroke", "black")
                    // tooltip to display region name and population density
                    .on("mouseover", function(d){
                        
                        var xPosition = (d3.mouse(this)[0]);
                        var yPosition = (d3.mouse(this)[1]);
                       // console.log(d.properties.NAME_2);
    
                        d3.select("div.tooltip")
                        //.style("left", xPosition + "px")
                        .style("left", xPosition + "px")
                        .style("top", yPosition + "px")	
                        //.select("#value")
                        .html(d.properties.NAME_2 + "<br>" + "Population Density: " + +d.properties.density.toFixed(2) + " people/square km");
            
                        //Show the tooltip
			            d3.select("div.tooltip").classed("hidden", false);
            
			       })
			       .on("mouseout", function() {
			        //Remove the tooltip
				    //d3.select("#tooltip").remove();
            
			        //Hide the tooltip
			        d3.select("div.tooltip").classed("hidden", true);
			       })
                    .style("fill", function(d){
            /*
                        console.log("region = " + d.properties.NAME_2);
                        console.log("density = " + d.properties.density);
                        console.log("color = " + color(d.properties.density));
             */
                        var density = d.properties.density;
                        /* I had to do this logic instead of
                        relying on the built-in color scales, because
                        the Copenhagen area is such an outlier.
                        These colors come from colorbrewer2.org */
                        if(!density){
                            return '#ccc';
                        }
                        if(density < 21){
                            //return 'rgb(255,255,217)';
                            return 'rgb(255,255,217)';
                        }
                        else if (density < 51){
                            return 'rgb(237,248,177)';
                        }
                        else if (density < 101){
                            return 'rgb(199,233,180)';
                        }
                        else if (density < 301){
                            return 'rgb(127,205,187)';
                        }
                        else if (density < 501){
                            return 'rgb(65,182,196)';
                        }
                        else if (density < 1001){
                            return 'rgb(29,145,192)';
                        }
                        else if (density < 1501){
                            return 'rgb(34,94,168)';
                        }
                        else if (density < 5001){
                            return 'rgb(37,52,148)';
                        }
                        else if (density < 10001){
                            return 'rgb(37,52,148)';
                        }
                        else{
                            return "rgb(8,29,88)";
                        }
                    }); 
		
                    console.log(json.features);
            
            /* Add a legend! */
            
            var legend = d3.select('svg')
                       .append('g')
                       .selectAll('g')
                       .data(color.range())
                       .enter()
                       .append('g')
                       .attr('class', 'legend')
                       .text("hi there")
                       .attr('transform', function(d, i){
                           var height = 30;
                           var x = 700;
                           var y = i * height;
                           return 'translate(' + x + ',' + (y + 40) + ')';
                       });
            // append a rectangle for each color in the range
            legend.append('rect')
                    .attr('width', 20)
                    .attr('height', 20)
                    .style('fill', function(d){ return d; })
                    .style('stroke', color);
            // append labels for each color rectangle
            legend.append('text')
                    .attr('x', 25)
                    .attr('y', 16)
                    .text(function(d, i){ 
                    // I had to make a "manual" color scale. 
                    // The quantized scale put almost all regions in the 
                    // lowest bucket because Copenhagen is such an
                    // outlier, so I made custom ranges for each color
                    var ranges = ["1-20", "21-50", "51-100", "101-300", "301-500", "501-1000", "1001-1500", "1501-5000", "5001-10000", ">10000"];
                        return ranges[i] + "   people/square km";
                    });
        });
    });
});

            
			