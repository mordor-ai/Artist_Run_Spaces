var width = 800;
var height = 600;
var color = d3.scaleOrdinal(d3.schemeGreys[9]);

function draw_graph(fichier){
  $('#viz').html('');
  console.log("data/kmeans/Kmeans"+fichier+".json");
  d3.json("data/kmeans/Kmeans"+fichier+".json").then(function(graph) {
    console.log(graph);
  var label = {
      'nodes': [],
      'links': []
  };

  graph.nodes.forEach(function(d, i) {
      label.nodes.push({node: d});
      label.nodes.push({node: d});
      label.links.push({
          source: i * 2,
          target: i * 2 + 1
      });
  });

  var labelLayout = d3.forceSimulation(label.nodes)
      .force("charge", d3.forceManyBody().strength(-50))
      .force("link", d3.forceLink(label.links).distance(0).strength(2));

  var graphLayout = d3.forceSimulation(graph.nodes)
      .force("charge", d3.forceManyBody().strength(-3000))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(1))
      .force("y", d3.forceY(height / 2).strength(1))
      .force("link", d3.forceLink(graph.links).id(function(d) {return d.id; }).distance(50).strength(1))
      .on("tick", ticked);

  var adjlist = [];

  graph.links.forEach(function(d) {
      adjlist[d.source.index + "-" + d.target.index] = true;
      adjlist[d.target.index + "-" + d.source.index] = true;
  });

  function neigh(a, b) {
      return a == b || adjlist[a + "-" + b];
  }


  var svg = d3.select("#viz").attr("width", width).attr("height", height);
  var container = svg.append("g");

  svg.call(
      d3.zoom()
          .scaleExtent([.1, 4])
          .on("zoom", function() { container.attr("transform", d3.event.transform); })
  );

  var link = container.append("g").attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter()
      .append("line")
      .attr("stroke", "#aaa")   
      .attr("stroke-width", function(d) { return Math.round(20*d.value); }); 

  var node = container.append("g").attr("class", "nodes")
      .selectAll("g")
      .data(graph.nodes)
      .enter()
      .append("circle")
      .attr("stroke-width", "2px")
      .attr("stroke","black")
      .attr("fill", function(d) { return color(Math.min(9,d.degree)); }) 
      .attr("r", function(d) { return 5+ 10*d.clustering_coeff; } )
      
  node.on("mouseover", focus).on("mouseout", unfocus);

  node.call(
      d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
  );

  var labelNode = container.append("g").attr("class", "labelNodes")
      .selectAll("text")
      .data(label.nodes)
      .enter()
      .append("text")
      .text(function(d, i) { return i % 2 == 0 ? "" : d.node.id; })
      .style("fill", "#555")
      .style("font-family", "Didot,serif")
      .style("font-size", 14)
      .style("pointer-events", "none"); // to prevent mouseover/drag capture

  node.on("mouseover", focus).on("mouseout", unfocus);

  function ticked() {

      node.call(updateNode);
      link.call(updateLink);

      labelLayout.alphaTarget(0.3).restart();
      labelNode.each(function(d, i) {
          if(i % 2 == 0) {
              d.x = d.node.x;
              d.y = d.node.y;
          } else {
              var b = this.getBBox();

              var diffX = d.x - d.node.x;
              var diffY = d.y - d.node.y;

              var dist = Math.sqrt(diffX * diffX + diffY * diffY);

              var shiftX = b.width * (diffX - dist) / (dist * 2);
              shiftX = Math.max(-b.width, Math.min(0, shiftX));
              var shiftY = 16;
              this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
          }
      });
      labelNode.call(updateNode);

  }

  function fixna(x) {
      if (isFinite(x)) return x;
      return 0;
  }

  function focus(d) {
      console.log(labelNode);
      var index = d3.select(d3.event.target).datum().index;
      node.style("opacity", function(o) {
          return neigh(index, o.index) ? 1 : 0.1;
      });
      labelNode.attr("display", function(o) {
        return neigh(index, o.node.index) ? "block": "none";
      });
      link.style("opacity", function(o) {
          return o.source.index == index || o.target.index == index ? 1 : 0.1;
      });
  }

  function unfocus() {
    labelNode.attr("display", "block");
    node.style("opacity", 1);
    link.style("opacity", 1);
  }

  function updateLink(link) {
      link.attr("x1", function(d) { return fixna(d.source.x); })
          .attr("y1", function(d) { return fixna(d.source.y); })
          .attr("x2", function(d) { return fixna(d.target.x); })
          .attr("y2", function(d) { return fixna(d.target.y); });
  }

  function updateNode(node) {
      node.attr("transform", function(d) {
          return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
      });
  }

  function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
  }

  function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
  }

  function dragended(d) {
      if (!d3.event.active) graphLayout.alphaTarget(0);
      d.fx = null;
      d.fy = null;
  }

  });
}
