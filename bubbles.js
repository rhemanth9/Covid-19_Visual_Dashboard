
var width = 960,
    height = 700;


d3.select("#bubbleChart").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "primarySVG");


//changeYear('2015');

$("label.cycleBtn").click(function() {
    changeYear(this.id);

});



    var dataSource = 'data/COVID1-19.csv';



d3.csv(dataSource, function(error, data) {

    data.sort(function(a,b) {return b.ratingClassValue - a.ratingClassValue;});


    var svg = d3.select("#primarySVG");



//set bubble padding
    var padding = 4;

    for (var j = 0; j < data.length; j++) {
        data[j].radius = 10;
        data[j].x = Math.random() * width;
        data[j].y = Math.random() * height;
    }

    var maxRadius = d3.max(_.pluck(data, 'radius'));


    var getCenters = function(vname, size) {
        var centers, map;
        centers = _.uniq(_.pluck(data,vname)).map(function(d) {
            return {
                name: d,
                value: 1
            };
        });

        map = d3.layout.pack().size(size);
        map.nodes({children: centers});

        return centers;
    };

    var nodes = svg.selectAll("circle")
        .data(data);

    nodes.enter().append("circle")
        //.attr("class", "node")
        .attr("class", function(d) {
            return d.ratingCategory;
        })
        .attr("cx", function(d) {
            return d.x;
        })
        .attr("cy", function(d) {
            return d.y;
        })
        .attr("r", 2)
        .attr("id", function(d){return d.name;})
        .on("mouseover", function(d) {
            showPopover.call(this, d);
        })
        .on("mouseout", function(d) {
            removePopovers();
        })
    ;

    var text = nodes.append("text")
        .attr("dx",12)
        .attr("dy",".35em")
        .text(function(d){
            return d.name;
        });



    nodes.transition()
        .duration(500)
        .attr("r", function(d) {
            return d.radius;})
    ;

  /*  var labels = ['0', '1-5', '6-10', '11-25', '26-100', '101-1000', '> 1000'];
    var colors = ['#a8dbda','#53a6fe','#ff0000','#a8dbda','#53a6fe','#ff0000'];
    var legend = svg.selectAll(".legend")
        .data(data).enter()
        .append("g")
        .attr("class","legend")
        .attr("transform", "translate(" + 780 + "," + 120+ ")");


    legend.append("rect")
        .attr("x", 0)
        .attr("y", function(d, i) { return 20 * i; })
        .attr("width", 15)
        .attr("height", 15)
        .style("fill", function(d) { return colors[d.i]});
    ;


    legend.append("text")
        .attr("x", 25)
        .attr("text-anchor", "start")
        .attr("dy", "1em")
        .attr("y", function(d, i) { return 20 * i; })
        .labels(function(d) {return labels[d.i]})
        .attr("font-size", "12px");


    legend.append("text")
        .attr("x",31)
        .attr("dy", "-.2em")
        .attr("y",-10)
        .text("Call Type")
        .attr("font-size", "17px");
*/



    var force = d3.layout.force();


    draw('reset');

    $("label.ratingBtn").click(function() {
        draw(this.id);
    });



    function draw(varname) {
        d3.selectAll("circle").attr("r",10);
        var centers = getCenters(varname, [width, height]);
        force.on("tick", tick(centers, varname));
        labels(centers);
        nodes.attr("class", function(d) {
            return d[varname];
        });
        force.start();
        makeClickable();
    }


    function tick (centers, varname) {
        var foci = {};
        for (var i = 0; i < centers.length; i++) {
            foci[centers[i].name] = centers[i];
        }
        return function (e) {
            for (var i = 0; i < data.length; i++) {
                var o = data[i];
                var f = foci[o[varname]];
                o.y += (f.y - o.y) * e.alpha;
                o.x += (f.x - o.x) * e.alpha;
            }
            nodes.each(collide(.2))
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
        }
    }


    function labels(centers) {
        svg.selectAll(".label").remove();

        svg.selectAll(".label")
            .data(centers).enter().append("text")
            .attr("class", "label")
            .text(function(d) {
                return d.name;
            })
            .attr("transform", function (d) {
                return "translate(" + (d.x - ((d.name.length)*3)) + ", " + (d.y + 15 - d.r) + ")";
            });


    }

    function removePopovers() {
        $('.popover').each(function() {
            $(this).remove();
        });
    }

    function showPopover(d) {
        $(this).popover({
            placement: 'auto top',
            container: 'body',
            trigger: 'manual',
            html: true,
            content: function() {
                return "Country Name: " + d.name + "</br>Deaths: " + d.Cumulative_Deaths + "</br>Confirmed cases: " + d.Confirmed_Cases;
            }
        });
        $(this).popover('show');
    }

    var cases = d3.scale.threshold()
        .domain([1,500, 360000])
        .range(["#a8dbda","#53a6fe","#ff0000"])
    ;




    function collide(alpha) {
        var quadtree = d3.geom.quadtree(data);
        return function(d) {
            var r = d.radius + maxRadius + padding,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                        y = d.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = d.radius + quad.point.radius + padding;
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };
    }

    var lowModGrad = svg.append("svg:defs")
        .append("svg:linearGradient")
        .attr("id", "lowModGrad")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    // Define the gradient colors
    lowModGrad.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#328ddb")
        .attr("stop-opacity", 1);

    lowModGrad.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#FE9A2E")
        .attr("stop-opacity", 1);

    var modHighGrad = svg.append("svg:defs")
        .append("svg:linearGradient")
        .attr("id", "modHighGrad")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    // Define the gradient colors
    modHighGrad.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#FE9A2E")
        .attr("stop-opacity", 1);

    modHighGrad.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#FE2E2E")
        .attr("stop-opacity", 1);

    var lowHighGrad = svg.append("svg:defs")
        .append("svg:linearGradient")
        .attr("id", "lowHighGrad")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    // Define the gradient colors
    lowHighGrad.append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#88DB54")
        .attr("stop-opacity", 1);

    lowHighGrad.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#FE2E2E")
        .attr("stop-opacity", 1);



    function makeClickable () {


        $("circle").click(function() {
            console.log(this.id);
        });

        var nest = d3.nest()
            .key(function(d){return d.name;})
            .entries(data);


    }
    nodes.exit().remove();

    var modal = document.getElementById("myModal");

    // Get the button that opens the modal
    var btn = document.getElementById("myBtn");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal
    btn.onclick = function() {
        modal.style.display = "block";
    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    // var color = d3.scale.threshold()
    //     .domain(['0', '1-5', '6-10', '11-25', '26-100', '101-1000', '> 1000'])
    //     .range(["#a8dbda","#53a6fe","#ff0000","#a8dbda","#53a6fe","#ff0000"])
    // ;
    // // var color = ['#a8dbda','#53a6fe','#ff0000','#a8dbda','#53a6fe','#ff0000'];
    // var g = svg.append("g")
    //     .attr("class", "legendThreshold")
    //     .attr("transform", "translate(20,20)");
    // g.append("text")
    //     .attr("class", "caption")
    //     .attr("x", 0)
    //     .attr("y", -6)
    //     .text("Confirmed Cases")
    //     .style("fill", "red");
    // var labels = ['0', '>10', '6-10', '11-25', '26-100', '101-1000'];
    // //var labels = ['1','10', '100', '200', '500', '750', '1000', '2500', '5000', '7500', '10000', '20000', '35000', '50000', '100000', '200000', '3000000', '360000'];
    // var legend = d3.legendColor()
    //     .labels(function (d) { return labels[d.i]; })
    //     .shapePadding(4)
    //     .scale(color);
    // svg.select(".legendThreshold")
    //     .call(legend)
    //     .style("fill", "white");
})


