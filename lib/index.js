import { SimpleNode, LinkProvider } from 'dslink';
import mac from 'mac-address';
import udp from 'dgram';

var socket;
var packetSize = 6 + (6 * 16);

function buildMagicPacket(address) {
  let buffer = new Buffer(packetSize);

  buffer.writeUInt8(0xFF, 0);
  buffer.writeUInt8(0xFF, 1);
  buffer.writeUInt8(0xFF, 2);
  buffer.writeUInt8(0xFF, 3);
  buffer.writeUInt8(0xFF, 4);
  buffer.writeUInt8(0xFF, 5);

  var value = 16;
  while((--value) >= 0) {
    var offset = (value + 1) * 6;
    address.copy(buffer, offset);
  }

  return buffer;
}

class WakeDevice extends SimpleNode.class {
  constructor(path) {
    super(path);
  }

  onInvoke(params) {
    if(typeof(socket) === 'undefined') {
      socket = udp.createSocket('udp4');
      socket.setBroadcast(true);
    }

    socket.send(buildMagicPacket(mac.toBuffer(params.address)), 0, packetSize, 7, '255.255.255.255');
  }
}

var link = new LinkProvider(process.argv.slice(2), 'onvif-', {
  defaultNodes: {
    addDevice: {
      $name: 'Wake Device',
      $is: 'wakeDevice',
      $invokable: 'write',
      $params: [
        {
          name: 'address',
          type: 'string'
        }
      ],
      @tooltip: 'Wake a device using Wake-Over-LAN.'
    }
  },
  profiles: {
    WakeDevice: (path) => {
      return new WakeDevice(path);
    }
  }
}, encodePrettyJson: true);

link.connect();
