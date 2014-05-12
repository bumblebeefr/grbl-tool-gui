p=$(pwd)

#fix libudev.so.0  error
# Ubuntu 13.x x64
#sudo ln -s /lib/x86_64-linux-gnu/libudev.so.1.3.5 /usr/lib/libudev.so.0
# Ubuntu 13.x x32
sudo ln -s /lib/i386-linux-gnu/libudev.so.1.3.5  /usr/lib/libudev.so.0

#install nodejs
sudo add-apt-repository ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs

#install node-webkit
wget http://dl.node-webkit.org/v0.9.2/node-webkit-v0.9.2-linux-ia32.tar.gz
tar -xzvf node-webkit-v0.9.2-linux-ia32.tar.gz

#install node-pre-gyp to build native modules
sudo npm -g install node-pre-gyp
sudo apt-get install build-essential

#get grbl sources
sudo apt-get install git
git clone grbl https://github.com/bumblebeefr/grbl-tool-gui.git

#install native serialport module
cd grbl-tool-gui
npm install serialport
cd node_modules/serialport
node-pre-gyp build --runtime=node-webkit --target=0.9.2

#make executables
cd "${p}"
mkdir builds
cd grbl-tool-gui
zip -r ../builds/grbl-tootl-gui-i386.nw ./*
cd "${p}"
cd builds
cat ../node-webkit-v0.9.2-linux-ia32/nw grbl-tootl-gui-i386.nw > grbl-tootl-gui-i386
cp ../node-webkit-v0.9.2-linux-ia32/nw.pak ./
#rm grbl-tootl-gui-i386.nw
