import React, { Component } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Header, Icon } from "react-native-elements";
import * as Permissions from "expo-permissions";
import * as ImagePicker from "expo-image-picker";
import UploadingOverlay from "./components/UploadingOverlay";
import firebase from "./config/Firebase";
import uuid from "uuid";

const VISION_API_KEY = "AIzaSyDzhWT9l90szQEJeDgXexfEF0JCORaufYs";

async function uploadImagesAsync(uri) {
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(e) {
      console.log(e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  const ref = firebase
    .storage()
    .ref()
    .child(uuid.v4());
  const snapshot = await ref.put(blob);

  blob.close();

  return await snapshot.ref.getDownloadURL();
}
class App extends Component {
  state = {
    hasGrantedCameraPermission: false,
    hasGrantedCameraRollPermission: false
  };

  state = {
    hasGrantedCameraPermission: false,
    hasGrantedCameraRollPermission: false,
    uploading: false,
    image: null,
    googleResponse: false
  };

  takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3]
    });
    this.handleImagePicked(pickerResult);
  };

  pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9]
    });
    this.handleImagePicked(pickerResult);
  };

  submitToGoogle = async () => {
    try {
      this.setState({ uploading: true });
      let { image } = this.state;
      let body = JSON.stringify({
        requests: [
          {
            features: [{ type: "LABEL_DETECTION", maxResults: 7 }],
            image: {
              source: {
                imageUri: image
              }
            }
          }
        ]
      });
      let response = await fetch(
        "https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}",
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          method: "POST",
          body: body
        }
      );
      let responseJson = await response.json();
      const getLabel = responseJson.responses[0].labelAnnotations.map(
        obj => obj.description
      );
      let result =
        getLabel.includes("Hot dog") ||
        getLabel.includes("hot dog") ||
        getLabel.includes("Hot dog bun");
      this.setState({
        googleResponse: result,
        uploading: false
      });
    } catch (error) {
      console.log(error);
    }
  };

  render() {
    const {
      hasGrantedCameraPermission,
      hasGrantedCameraRollPermission,
      uploading
    } = this.state;
    if (
      hasGrantedCameraPermission === true &&
      hasGrantedCameraRollPermission === true
    ) {
      return (
        <View style={{ flex: 1, marginTop: 100 }}>
          <Text>No access to Camera or Gallery!</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          {}
          <Header
            statusBarProps={{ barStyle: "light-content" }}
            backgroundColor="black"
            leftComponent={
              <TouchableOpacity onPress={this.pickImage}>
                <Icon name="photo-album" color="#fff" />
              </TouchableOpacity>
            }
            centerComponent={{
              text: "Not Hotdog?",
              style: { color: "#fff", fontSize: 20, fontWeight: "bold" }
            }}
            rightComponent={
              <TouchableOpacity onPress={this.takePhoto}>
                <Icon name="camera-alt" color="#fff" />
              </TouchableOpacity>
            }
          />
          {uploading ? <UploadingOverlay /> : null}
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});

export default App;
