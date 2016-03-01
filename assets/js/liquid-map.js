// Globals
 var map, iw, timer;
 var glob = {marks:[], polies:[]};

 // Global library functions
 var $id = function(id) {return document.getElementById(id)};
 var $make = function(item, id, myclass) {
  var el = document.createElement(item);
  if (id) el.id = id;
  if (myclass) el.className = myclass;
  return el;
 };


function normalize() {
  // Resets all icons
  for (var i = 0, m; m = glob.marks[i]; i++) {
   if (m.iw_open) { 
    m.iw_open = false;
    m.setIcon(icon(m.col));
    $id("member"+i).previousSibling.style.backgroundPosition = "-33px 0";
   }
  }
}


function getWindowSize() {
  var w, h;
  if(typeof(window.innerWidth) == "number") {
    // Non-IE
    w = window.innerWidth;
    h = window.innerHeight;
  } else if(document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight) ) {
    // IE 6+ in 'standards compliant mode'
    w = document.documentElement.clientWidth;
    h = document.documentElement.clientHeight;
  } else if(document.body && (document.body.clientWidth || document.body.clientHeight) ) {
    // IE 4 compatible
    w = document.body.clientWidth;
    h = document.body.clientHeight;
  }
  return {width:w,height:h};
}


function fitBounds(col) {
  // Fits the map bounds for the markers of each group
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0, m; m = glob.marks[i]; i++) {
   if (m.col == col) {
     bounds.extend(m.getPosition());
   }
  }
  map.fitBounds(bounds);
}


function zoomToGroup(nr, col, id) {
  // Triggers a checkbox click if unchecked, otherwise calls fitBounds
  var box = document.forms["f"+nr].elements[0];
   if (!box.checked) {
    box.click();
   }
   else {
    fitBounds(col);
   }
}

function icon(group, scale) {
  // Returns the appropriate marker icon for each group
  var g = google.maps;
  var base = "http://maps.gstatic.com/mapfiles/ms/icons/"+ group +"-dot.png";
  var image;
   if (scale) { // Stretched icon
    image = { url: base,
     size: new g.Size(38, 39),
     anchor: new g.Point(18, 39),
     scaledSize: new g.Size(38, 39) };
   }
   else { // Normal icon
    image = { url: base,
     size: new g.Size(32, 32),
     anchor: new g.Point(15, 32) };
   }
  return image;
}


function createPoly(col, id) {
  // Creates the appropriate polygon for each group
  var path = [];
  // stroke and fill colors for red, green, blue
  var poly_col = {"red": ["#FF3300", "#FF7777"],
   "green": ["#006600", "#CC9900"],
   "blue": ["#3355FF", "#335599"]};

  for (var i = 0, m; m = glob.marks[i]; i++) {
   if (m.col == col) {
    path.push(m.getPosition());
   }
  }
  var poly = new google.maps.Polygon({
   path: path, map: map,
   strokeColor: poly_col[col][0],
   strokeOpacity: .2,
   strokeWeight: 3,
   fillColor: poly_col[col][1],
   fillOpacity: .2
  });
  poly.setVisible(false);
  poly.col = col;
  glob.polies.push(poly);
}


function mouseEvents(col, i){
  // Adds mouseover and mouseout events to the members links
  var element = $id("member" +i);
  var circle = element.previousSibling;
  var pic = {"red":"0 0","green":"-11px 0","blue":"-22px 0"};

  element.onmouseover= function() {
   var m = glob.marks[i];
   if (!m.iw_open){
    timer = setTimeout(function() {
      circle.style.backgroundPosition = pic[col];
      m.setIcon(icon(col, 1))}, 180);
   }
  };

  element.onmouseout= function() {
   var m = glob.marks[i];
   if (timer) clearTimeout(timer);
   if(!m.iw_open) {
     setTimeout(function(){
     circle.style.backgroundPosition= "-33px 0";
     m.setIcon(icon(col))}, 180);
   }
  };
}


function createMarker(point, loc, name, addr, group, i) {

  var g = google.maps;
  var base = "http://maps.gstatic.com/mapfiles/";
  var pic = {"red":"0 0", "green":"-11px 0", "blue":"-22px 0"};

  var image = { url: base+ "ms/icons/" + group +"-dot.png",
   size: new g.Size(32, 32),
   anchor: new g.Point(15, 32) };

  var shadow = { url: base+"kml/paddle/A_maps.shadow.png",
   size: new g.Size(59, 32),
   anchor: new g.Point(15, 32) };

  var marker = new g.Marker({ position: point, map: map,
    clickable: true, icon: image, shadow: shadow, title: loc
  });

  marker.setVisible(false);
  marker.col = group;
  marker.loc = loc;
  glob.marks.push(marker);

  g.event.addListener(marker, "click", function() {
   var content = "<div class='iw'><b>" + name +"<\/b><br \/>" +
    addr + "<br \/>"+loc + "<\/div>";
   iw.setContent(content);
   iw.open(map, this);
   normalize();
   glob.marks[i].iw_open= true;
   this.setIcon(icon(group, 1));
   $id("member"+i).previousSibling.style.backgroundPosition = pic[group];
  });
 return marker;
}


function readData() { // Create Ajax request to fetch XML file

 var base = "http://maps.gstatic.com/mapfiles/ms/icons/";
 var request;
 try {
   if (typeof ActiveXObject != "undefined") {
     request = new ActiveXObject("Microsoft.XMLHTTP");
   } else if (window["XMLHttpRequest"]) {
     request = new XMLHttpRequest();
   }
 } catch (e) {}

  request.open("GET", "../groups-data.xml", true);
  request.onreadystatechange = function() {
  if (request.readyState == 4) {

   var xml = request.responseXML;

   var markers = xml.documentElement.getElementsByTagName("marker");
   for(var j = 0, n; n = markers[j]; j++) {
    // Obtain the attributes of each marker
    var lat = parseFloat(n.getAttribute("lat"));
    var lng = parseFloat(n.getAttribute("lng"));
    var point = new google.maps.LatLng(lat,lng);
    var loc = n.getAttribute("loc");
    var address = n.getAttribute("addr");
    var id = n.getAttribute("nr");
    var name = n.getAttribute("name");
    var group = n.getAttribute("group");
    // Create the markers
    createMarker(point, loc, name, address, group, j);
   }

   var groups = xml.documentElement.getElementsByTagName("group");
   for(var i = 0, m; m = groups[i]; i++) {
    // Obtain the attributes of each group
    // and create the groups' checkboxes, icons, links, and polygons
    var name = m.getAttribute("name");
    var color = m.getAttribute("color");
    var id = m.getAttribute("nr");
    var num = m.getAttribute("members");
    var div = $make("div", id);
    div.style.marginTop = "20px";
    div.innerHTML = "<form id="+'f'+i +"><input type='checkbox'" +
     " onclick='toggleGroup(\"" +color+ "\", \"" +id+ "\", this.checked)'>" +
     "<img style='vertical-align: middle' src=" + base + color + "-dot.png>" +
     "&nbsp;<a href='#' onclick=\"zoomToGroup(" +i+ ", '" +
      color+ "', '" +id +"');return false;\"><b>" +
      name+ "<\/b><\/a> (" +num+ ")<\/form>";

    // Append the group items to tab #1
    $id("listing").appendChild(div);
    // Create the polygon
    createPoly(color, id);
   }
  }
 }; request.send(null);
}


function myresize() {
  var size = getWindowSize(),
  mapdiv = map.getDiv(); 
  var n_width = (map.large) ?size.width:size.width-360;
   mapdiv.style.width= n_width +"px";
   mapdiv.style.height= size.height-246 +"px";
  $id("allpanelCards").style.height = size.height-181 +"px";
  // IE crutch
  if(document.all) google.maps.event.trigger(map,"resize");
}


function init() { // Create the map

  var size = getWindowSize();
  $id("allpanelCards").style.height= size.height-181 +"px";
  var mapdiv = $id("gmap");
  mapdiv.style.height= size.height-246 +"px";
  mapdiv.style.width= size.width- 360 +"px";
  var g = google.maps;
  var center = new g.LatLng(49.09486, 6.15221);
  var opts_map ={
    zoom: 5,
    center: center,
    scaleControl: true,
    streetViewControl: true,
    draggableCursor:'auto',
    mapTypeId: g.MapTypeId.ROADMAP,
    overviewMapControl: true,
    overviewMapControlOptions: {opened:false}
  };
  map = new g.Map(mapdiv,opts_map);
  map.large = false;
  iw = new g.InfoWindow();

  g.event.addListener(iw, "closeclick", function() {
    normalize();
  });

  // v2 behaviour
  g.event.addListener(map, "click", function() {
    normalize();
    iw.close();
  });
  var arrow = $id("minimize");
  map.getDiv().appendChild(arrow);

  var input = $id("addr");
  var autocomplete = new g.places.Autocomplete(input);
  // IE resize crutch
  if(document.all) mapdiv.onresize = myresize;
  readData();
}


function triggerClick(i) {
  // Triggers a marker click event
  google.maps.event.trigger(glob.marks[i],"click");
}


function toggleGroup(col, id, checked) {
 // Shows and hides the group members
  var parent = $id(id);
  if (checked) fitBounds(col);

  for (var i= 0, m; m = glob.marks[i]; i++) {
   if (m.col == col) {
    m.setVisible(checked);
    // Add links of members when group is shown
    if (checked) {
     var member = $make("p", null, col);
     member.innerHTML = "<span class='circle'><\/span>" +
      "<a class='memberlink' id='member"+i+
      "' href='javascript:triggerClick("+i+")'>" + m.loc + "<\/a>";
     parent.appendChild(member);
     mouseEvents(col, i);
    }
    else {
     // Remove members' links
     normalize();
     for (var k = 0,c; c = parent.getElementsByTagName("p")[k]; k++) {
      parent.removeChild(c);
     }
     iw.close();
    }
   }
  }
  // Toggle the corresponding polygon
  for(var j= 0, p; p = glob.polies[j]; j++) {
   if (p.col == col) {
    p.setVisible(checked);
   }
  }
}


function changeWidth(el, dir, toWidth) {
  // Changes the map width
  var width  = el.offsetWidth,
  change = (toWidth > width)? (toWidth - width) : -(width - toWidth),
  // Animation
  total = width + Math.ceil((change/2));
  el.style.width = total + "px";

  function c() {
   changeWidth(el, dir, toWidth);
  }

  if ((dir == "left" && change <= 0) || (!dir && -change <= 10)) {
    clearTimeout(changeWidth.timer);
    // Width end correction - necessary on account of animation
    el.style.width = toWidth + "px";
    google.maps.event.trigger(map,"resize");
    return;
  }
  changeWidth.timer = setTimeout(c, 70);
}


function togglePanel(dir) {
  // Shows and hides leftpanel
  var a = $id("minimize"), b = $id("rightpanel"),
  c = $id("panel-foot"),
  el = map.getDiv(),
  fullwidth = getWindowSize().width,
  normalwidth = fullwidth-374;
  clearTimeout(changeWidth.timer);

  if (dir == "left") {
   map.large = true;
   a.style.display = "block";
   b.className = "hidden";
   //c.style.display = "none";
   changeWidth(el, dir, fullwidth);
  }
  else {
   map.large = false;
   changeWidth(el, null, normalwidth);
   a.style.display = "none";
   b.className = "";
  // c.style.display = "block";
  }
}


function flipTab(card) {
  // Toggles panel tabs and corresponding cards
  // and changes tabs' colors
  var tabs = $id("panel-tabs").getElementsByTagName("span");
  var card_ids = ["listing", "favorites", "mysearches"];
  for (var j = 0, t, c; c = card_ids[j],t = tabs[j]; j++) {
    $id(c).style.display = (card == c) ? "block" : "none";
    t.style.backgroundColor= (card == c) ? "#e7e7e7" : "#f5f5f5";
  }
}


function showAddress(address) {
  var g = google.maps;
  var geocoder = new g.Geocoder();

  geocoder.geocode({ 'address': address}, function(results, status) {
    if (status == g.GeocoderStatus.OK) {
      // map.fitBounds(results[0].geometry.viewport);
      map.setCenter(results[0].geometry.location);
      map.setZoom(10);
    } else {
      alert(address + " not found: " + status);
    }
  });
}

  // Load the map
  window.onload = init;
  // Take care of resizing the browser window
  window.onresize = myresize;