var Insteon = require('../').Insteon;

var HOST = 'my.home';
var PORT = 25105;
var USERNAME = 'admin';
var PASSWORD = 'password';


var gw = new Insteon(HOST, PORT, USERNAME, PASSWORD);

var network = {};

gw.info(function onInfo(err, info) {
  if(err) {
    return console.log('Failed to connect to gateway, ' + err);
  }

  network[info.id] = info;
  console.log('Found gateway: ' + info.id + ' - ' + info.deviceCategory.name);

  gw.links(function onLinksFound(err, links){
    if(err) {
      return console.log('Failed to find any links because of an error, ' + err);
    }

    if(links && links.length > 0){
      network[info.id].links = links.slice(); // copy array
      foundLinks(links);
    } else {
      console.log('No links found.  Entering linking mode for 3 minutes.\n\nHold set button on device.');
      gw.link(180, function(err, link) {
        if(err) {
          return console.log('Failed to link, ' + err);
        }

        foundLinks([link]);
      });
    }
  });
});


function foundLinks(links) {
  if(links.length === 0) {
    // All Donefor(var id in network)
    return printNetwork();
  }
  var link = links.shift();

  if(network[link.id]){
    return foundLinks(links); // already found this link
  }

  gw.info(link.id, function onProfile(err, profile) {
    if(err || !profile){
      console.log('Found new link: ' + link.id + ' - Unresponsive!');
      network[link.id] = null;
      return foundLinks(links);
    }

    console.log('Found new link: ' + link.id + ' - ' + profile.deviceCategory.name);
    network[link.id] = profile;

    gw.links(link.id, function onDeviceLinksFound(err, moreLinks) {
      if(err) {
        console.log('Error getting links for devcie ' + link.id + ' - skipping');
        return foundLinks(links);
      }
      network[link.id].links = moreLinks;
      foundLinks(links.concat(moreLinks));
    });
  });
}

function printNetwork() {
  console.log('\n\nNetwork Map:');
  for(var id in network) {
    var controls = [];
    var type = 'Unresponsive';
    if(network[id]){
      type = network[id].deviceCategory.name;
      for(var i = 0; i<network[id].links.length; i++){
        if(network[id].links[i].isController) {
          controls.push(network[id].links[i].id);
        }
      }
    }
    console.log('%s - %s', id, type);
    if(controls.length) {
      console.log('\tControls: %s', controls.join());
    }
  }
}