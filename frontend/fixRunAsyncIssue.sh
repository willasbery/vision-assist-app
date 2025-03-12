#!/bin/sh
set -e 

# Patch node_modules/react-native-vision-camera/src/frame-processors/runAsync.ts so that it can be used in a release build. 

pushd node_modules/react-native-vision-camera/src/frame-processors

sed -i 's/const asyncContext = Worklets.createContext('\''VisionCamera.async'\'')/const asyncContext = Worklets.defaultContext/g' runAsync.ts

popd

echo "Done" 