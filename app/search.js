'use strict';
/**
 * Searchcontrollers 
 *
 * LICENSE: Some license information
 *
 * @category LiquidMap - Angularjs
 * @package Angular Controller
 * @subpackage controller_search
 * @version  $Id:$v.1.0
 * @date 29-09-2014
 * @author debugger@hotmail.co.uk
 */

/**
 * @ngdoc function
 * @name SearchCtrl
 * @function
 *
 * @description Search page which show the result with keyword or get my location.
 * @param {string} services, scope, location and http
 * @returns {string} null
 * @author kavya Sagar
 * @date 29-09-2014
 */
 var glob = {marks:[]};

function searchCtrl($scope, $cookies, $rootScope) {  
    // Globals
    var map, iw, timer, autocomplete, placesList, zm = 15, loop, plcItern = 0;
    $scope.pservice = ''; 
    $scope.iMark = {};  $scope.userlsLineups = [];
    //var glob = {marks:[], polies:[]};

    // Global library functions
    var $id = function(id) {return document.getElementById(id)};
    var $make = function(item, id, myclass) {
    var el = document.createElement(item);
    if (id) el.id = id;
    if (myclass) el.className = myclass;
        return el;
    };
    var g = google.maps;
    $scope.init = function() { // Create the map

        var size = $scope.getWindowSize();
        $id("allpanelCards").style.height= size.height-210 +"px";
        var mapdiv = $id("gmap");
        mapdiv.style.height= size.height-210 +"px";
        mapdiv.style.width= size.width-320 +"px";
        
        var Lat, Lon, isMark = false;

        if($cookies.placelocation){
            var locn = $cookies.placelocation;
            var geoloc = locn.split(",");
            Lat = geoloc[0];
            Lon = geoloc[1];
            isMark = true;

            //delete $cookies["placelocation"]              
        }else{  
            Lat = 33.75769 ; 
            Lon = -84.400829;           
        }     
        
        var center = new g.LatLng(Lat, Lon);
        var opts_map ={
           zoom: 5,
           center: center,
           scaleControl: true,
           streetViewControl: true,
           draggableCursor:'auto',
           mapTypeId: g.MapTypeId.ROADMAP,
           overviewMapControl: false,
           //overviewMapControlOptions: {opened:false}
        };
      
        map = new g.Map(mapdiv,opts_map);
        map.large = false;
        iw = new g.InfoWindow();

        g.event.addListener(iw, "closeclick", function() {
            $scope.normalize();
        });

        // v2 behaviour
        g.event.addListener(map, "click", function() {
            $scope.normalize();
            iw.close();
        });
        var arrow = $id("minimize");
        map.getDiv().appendChild(arrow);

        var input = $id("addr");
        autocomplete = new g.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);
        $scope.showAddress();
        placesList = $id("places");

        /* To repopulate places */
        if(isMark){     
            $scope.nearBySearch(Lat, Lon); 
            var zoomChangeBoundsListener =  g.event.addListenerOnce(map, 'bounds_changed', function(event) {
                if (this.getZoom()){
                    this.setZoom(15);
                }
            });             
        }

        // IE resize crutch
        if(document.all) mapdiv.onresize = $scope.myresize;
        //readData();
    };

    $scope.getWindowSize = function() {
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
    };


    $scope.normalize = function() {
      // Resets all icons
      for (var i = 0, m; m = glob.marks[i]; i++) {
       if (m.iw_open) { 
          m.iw_open = false;
          m.setIcon($scope.icon(m.col));
          //$id("member"+i).previousSibling.style.backgroundPosition = "-33px 0";
       }
      }
    };


    $scope.myresize = function() {
      var size = $scope.getWindowSize(),
      mapdiv = map.getDiv(); 

      var n_width = (map.large) ?size.width:size.width-320;
      mapdiv.style.width= n_width +"px";
      mapdiv.style.height= size.height-210 +"px";

    
      // IE crutch
      if(document.all) google.maps.event.trigger(map,"resize");
    };

    $scope.togglePanel = function(dir) {
      // Shows and hides leftpanel
      var a = $id("minimize"), b = $id("rightpanel"),
      c = $id("panel-foot"),
      el = map.getDiv(),
      fullwidth = $scope.getWindowSize().width,
      normalwidth = fullwidth-320;
      clearTimeout($scope.changeWidth.timer);

      if (dir == "left") {
       map.large = true;
       a.style.display = "block";
       b.className = "hidden";
       //c.style.display = "none";
       $scope.changeWidth(el, dir, fullwidth);
      }
      else {
       map.large = false;
       $scope.changeWidth(el, null, normalwidth);
       a.style.display = "none";
       b.className = "";
      // c.style.display = "block";
      }
    };

    $scope.changeWidth = function(el, dir, toWidth) {
        // Changes the map width
        var width  = el.offsetWidth,
        change = (toWidth > width)? (toWidth - width) : -(width - toWidth),
        // Animation
        total = width + Math.ceil((change/2));
        el.style.width = total + "px";

        function c() {
            $scope.changeWidth(el, dir, toWidth);
        }

        if ((dir == "left" && change <= 0) || (!dir && -change <= 10)) {
            clearTimeout($scope.changeWidth.timer);
            // Width end correction - necessary on account of animation
            el.style.width = toWidth + "px";
            google.maps.event.trigger(map,"resize");
            return;
        }
        $scope.changeWidth.timer = setTimeout(c, 70);
    };

    $scope.icon = function(group, scale) {
        // Returns the appropriate marker icon for each group
        var color;
        switch(group){
          case 'red':
            color = '#DB979A';
            break;
          case 'blue':
            color = '#80BDB6';
            break;
          case 'green':
            color = '#80BDB6';
            break;
        }
   
        var svgIcon = {
                      path: 'M16.897,1.24c-8.822,0-16,7.178-16,16c0,14.142,14.626,30.951,15.249,31.66c0.19,0.216,0.464,0.34,0.751,0.34c0.001,0,0.003,0,0.005,0c0.289-0.001,0.563-0.128,0.752-0.347c0.623-0.722,15.243-17.837,15.243-31.653C32.897,8.418,25.72,1.24,16.897,1.24z M16.897,23.029c-2.641,0-4.789-2.148-4.789-4.789s2.148-4.789,4.789-4.789s4.789,2.148,4.789,4.789S19.538,23.029,16.897,23.029z',                      
                      fillOpacity: 2,
                      strokeColor: '#ffffff',
                      fillColor: color,
                      strokeWeight: 2,
                      scale: 0.75
                    }; 

        return svgIcon;  
    };

    $scope.createMarker = function(place, i) {
     
        var point   = place.geometry.location,
            loc     = place.vicinity,
            name    = place.name,     
            rating  = place.rating? place.rating:0,
            photo   = place.photos? place.photos:null,
            placeId = place.place_id;
       
        // check place in user list
        var pflag = false;
        if($rootScope.userLog){          
          var lineups = ($scope.userlsLineups.length > 0)? $scope.userlsLineups : $rootScope.userLineups;                
          $scope.userlsLineups = [];
          if(lineups){ 
              angular.forEach(lineups, function(value, key) {    
                  angular.forEach(value.lineups, function(val, kei) {  
                     if(val.google.place_id == placeId){                     
                        pflag = true;
                     }
                  });
              });
          }              
        }//    

        var g     = google.maps;
        var base  = "http://maps.gstatic.com/mapfiles/";       
        var group = (!pflag)? 'green' : 'red';
    
        var shadow = { url: base+"kml/paddle/A_maps.shadow.png",
                       size: new g.Size(59, 32),
                       anchor: new g.Point(15, 32) 
                     };

        var svgIcon = $scope.icon(group, 1);                        

        var marker  = new g.Marker({ position: point, map: map,
                        clickable: true, icon: svgIcon, shadow: shadow, title: loc
                    });

        marker.setVisible(true);
        marker.col = group;          
        marker.is_added = pflag;         
        glob.marks[i] = marker;            

        g.event.addListener(marker, "click", function() {   
          
            var content = '';
            content += '<div class="custom_popup">';
            
            content += '<div class="mapcontent"><h3>'+ name +'</h3>';

            if(rating){
                content +='<em>Rating : '+rating+'</em>';
            }
            /*if(photo.length >0){
                var img = photo[0].getUrl({'maxHeight': 100});          
                if(img) content +='<p><img src="'+img+'" alt=""/></p>';
            }*/
            if(loc)content += '<p>' +loc+'<p></div></div>';

            iw.setContent(content);
            iw.open(map, this);

            $scope.normalize();
            glob.marks[i].iw_open = true;
          
            //this.setIcon($scope.icon(group, 1));           
            //$id("member"+i).previousSibling.style.backgroundPosition = pic[group];

            /* Add to lineup */ 
            google.maps.event.addListener(iw, 'domready', function() {        
             
            });//
           
        });

        return marker;
    };

    $scope.showAddress = function() {       
        var address = $id("addr").value;
        var glob = {marks:[]};

       google.maps.event.addListener(autocomplete, 'place_changed', function() {

          var place = autocomplete.getPlace();
          if (!place.geometry) {
              return;
          }         
         
          $cookies.placelocation = place.geometry.location.lat()+','+ place.geometry.location.lng();
        
          for (var i = 0, marker; marker = glob.marks[i]; i++) {
            marker.setMap(null);
          }
          // Reinitialize
          placesList.innerHTML = ''; 
          loop = 1;
          zm = 15; 
          plcItern = 0;
          glob.marks = [];
          $scope.userlsLineups = [];

          $('.show-btn-sec').css('display', 'none');

          // If the place has a geometry, then present it on a map.
          if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
          } else { 
              map.setCenter(place.geometry.location);
             // map.setZoom(17);  // Why 17? Because it looks good.
          }
          map.setZoom(zm);  // Why 17? Because it looks good.        
          
          // Create the markers          
          //$scope.createMarker(place, 0);                    

          // Nearby places search
          $scope.nearBySearch(place.geometry.location.lat(), place.geometry.location.lng());
                  
        });  
    };


    // Load near by location using radar search and display apartments on it
    $scope.nearBySearch = function(Lat, Lon){  
        var pyrmont = new google.maps.LatLng(Lat, Lon);
        
        map.setCenter(pyrmont);

        var request = {
            location: pyrmont,
            radius: 2000,
            keyword: 'apartments -realty -lodging -inn -office -corporate -executive -locators',
            rankby: 'distance',
            types: ['establishment']
        };
        
        $scope.pservice = new google.maps.places.PlacesService(map);
        
        $scope.pservice.nearbySearch(request, $scope.callbackNearBy);
    };

    // find near by location
    $scope.callbackNearBy = function(results, status, pagination){ 
      
        if (status != google.maps.places.PlacesServiceStatus.OK) {
            return;
        } else {        
           
            for (var i = 0; i < results.length; i++) {                 
                placesList.innerHTML += '<li><a href="#" onclick="triggerClick('+plcItern+');" id="member'+plcItern+'" class="placelink">' + results[i].name + '</a></li>';
                
                $scope.createMarker(results[i], plcItern);
                plcItern = plcItern + 1;
            }
            
            if (pagination.hasNextPage) {
              var moreButton = document.getElementById('more');             
              moreButton.disabled = false; 
  
              $('.show-btn-sec').css('display', 'block');

              google.maps.event.addDomListenerOnce(moreButton, 'click',
                  function() {
                  zm = 13;//zm-2;     
                  map.setZoom(zm);  
                  moreButton.disabled = true;  
                  loop++;
                  if(loop >=2){
                      $('.show-btn-sec').css('display', 'none');
                  }
                             
                  pagination.nextPage();
              });

            }
        }
    };

    window.onresize = $scope.myresize

}

/* To trigger  */
function triggerClick(i){  
  // Triggers a marker click event
  google.maps.event.trigger(glob.marks[i],"click");
}
