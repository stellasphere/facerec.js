# facerec.js

A JavaScript package designed specifically for facial recognition. A wrapper of [faceapi.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html) and has a heavy dependency on it.

Compared to faceapi.js, which is centered around several uses, one of them being facial recognition, this package is a more streamlined version with facial recognition in mind.

# Getting Started

## Installation
facerec.js has a heavy dependency on [faceapi.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html).
```html
<script src="https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/dist/face-api.js"></script>
<script src="https://cdn.jsdelivr.net/gh/stellasphere/facerec.js@main/facerec.js"></script>
```

## Initialize
facerec.js needs to initialize first.
```js
await facerec.init() // default init using await

await facerec.init({
  TinyFaceDetector: true,
  SsdMobilenetv1: true
}) // custom options using await

facerec.init().then(async function(){
  // facerec.js can be used here now
}) // default init using '.then()'
```

# Guide
This guide will go over an example of creating and using a facial recognition model. 

This example will be using the four characters on [the TV show 'The Office'](https://www.peacocktv.com/stream-tv/the-office/characters) Michael, Jim, Dwight, and Pam. 

#### Creating a dataset
To 'train' the model to recognize faces, you need reference pictures of them. To organize them all, you can create a `FaceRecDataset`.
```
var dataset = new FaceRecDataset()

console.log("created dataset:", dataset)
```

#### Adding images to the dataset
There are two methods for adding images to a dataset. One is via `addImageURL()` and the other is `addImages()`.

Adding images via the `addImageURL()` method is ideal, especially when the number of images you want to add is low.
```js
var michaelimg = "https://upload.wikimedia.org/wikipedia/en/d/dc/MichaelScott.png" // the URL can be either relative (local on disk) or absolute (a full URL) 
dataset.addImageURL("Michael Scott",michaelimg)
```

Adding images via the `addImages()` method is better when there are a lot of images to add. The `addImages()` function accepts a array of objects. 

> By default, it is expected that a property named `label` has the name/label that will be attached to the face and a property called `imageurl` has the link to the image. If it does not, you can specify a custom interpreter function that returns the proper label and imageurl. The interpreter is not required if the objects in the array already have their respective labels and image URLs to their designated property.
```js
var images = [
  {
    name: "Jim Halpert",
    url:"https://upload.wikimedia.org/wikipedia/en/7/7e/Jim-halpert.jpg"
  },
  {
    name: "Dwight Schrute",
    url:"https://upload.wikimedia.org/wikipedia/en/c/cd/Dwight_Schrute.jpg"
  },
  {
    name: "Pam Beesly",
    url:"https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Pam_Beesley.jpg/220px-Pam_Beesley.jpg"
  }
]

dataset.addImages(images,function(image){
  return {
    label: image.name,
    imageurl: image.url
  }
})

console.log("dataset images:",dataset.images)
```
Both methods just add images to the dataset's array of images, so they both work the same.

#### Converting to facial data
This step takes the images and turns them into what is called a face descriptor, which are unique points on a person's face that can be used to identify them.
```js
var labeleddescriptors = await dataset.toLabeledFaceDescriptors()

console.log("descriptors:",labeleddescriptors)
```

#### Creating the recognizer
Now you can create the recognizer. It requires a threshold value which means the lowest percent confidence the model can have before returning that face. (1 = 0%, 0 = 100%)
```js
var threshold = 0.3 // 70%
var recognizer = await facerec.recognizer(labeleddescriptors,threshold)

console.log("recognizer:",recognizer)
```

#### Using the recognizer
Then you can use the recognizer in a variety of different ways.

##### Recognizing a image and "drawing" results
```js
var image = document.querySelector("#theofficeimg")
var imageresults = await recognizer.recognizeImage(image)
facerec.drawResults(imageresults,image)
console.log("image results:",imageresults)
```

##### Getting the raw results from a URL image
To recognize a image from a URL, it needs to be in the form of a `img` element. A URL can be converted using the `facerec.getImage()` function.
```js
var urlimage = await facerec.getImage("https://m.media-amazon.com/images/I/51V0BCZiznL._SY445_.jpg")
var urlimageresults = await recognizer.recognizeImage(urlimage)

console.log(urlimageresults)
/*
[
  { "label": "unknown", ... },
  { "label": "Dwight Schrute", ... },
  { "label": "Jim Halpert", ... },
  { "label": "Pam Beesly", ... },
  { "label": "Michael Scott", ... },
  { "label": "unknown", ... }
]
*/
```


# API

## *async function:* facerec.init(options)
Initalizes facerec.js
#### Arguments
- options: A optional argument for the options of facerec.js
#### Example
```js
await facerec.init({
  modelsurl: "/models",
  TinyFaceDetector: false,
  SsdMobilenetv1: true,
  Mtcnn: false,
  modelpriority: ["SsdMobilenetv1"], // 
  overlaytext: function(result) {
    return `${result.label} (${result.percentconfidence}%)`
  }
})
```
#### Options
- **modelsurl:** Location of the directory where the facial recognition models are located.
- **TinyFaceDetector, SsdMobilenetv1, Mtcnn:** Option to load that model
- **modelpriority:** Priority of the model used. If a face can't be detected using the first model, it will try using other models and go down the list.
- **overlaytext:** A function that generates the text tags when the recognition results are visualized. Like in the `facerec.drawResults()` function and the webcam detection.

**Returns:** None

## *async function:* facerec.getImage(imageurl)
Almost all image inputs in facerec.js are required to be in an HTML `img` element format. *Except the datasets* This function converts a URL into an HTML image element.
#### Arguments
- imageurl: A URL (either relative or absolute URL) for a image.
#### Example
```js
var relativeimage = await facerec.getImage("image.png") // relative
var absoluteimage = await facerec.getImage("https://website.com/image.png") // absolute
```

**Returns:** A [HTMLImageElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) (Links to MDN web docs)


## *async function:* facerec.facedescriptor(faceimage)
Gets the identifying features/characteristics of a face. If there are multiple faces in an image, it will return the one with the highest confidence. If you need to detect multiple faces, use `facerec.facedescriptors()`.  

If you have more than one model specified in `modelpriority`, it will default to the first model, then use subsequent models if a face is not found.

#### Arguments
- faceimage: A image in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id.  (For using a image URL, look to `facerec.getImage()`)

#### Example
```
// with a element id
var result = await facerec.facedescriptor("elementid")

// with a element
var image = document.querySelector(".image")
var result = await facerec.facedescriptor(image)

// with a image URL
var image = await facerec.getImage("https://website.com/image.png")
var result = await facerec.facedescriptor(image)
```
  
**Returns:** A object with the descriptor (`object.descriptor`) and the description. (`object.description`) 


## *async function:* facerec.facedescriptors(faceimage)
Gets the identifying features/characteristics of all faces in a image. 'Multi-face' version of `facerec.facedescriptor()`.  
#### Arguments
- faceimage: A image in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id. (For using a image URL, look to `facerec.getImage()`)

#### Example
```
// with a element id
var result = await facerec.facedescriptors("elementid")

// with a element
var image = document.querySelector(".image")
var result = await facerec.facedescriptors(image)

// with a image URL
var image = await facerec.getImage("https://website.com/image.png")
var result = await facerec.facedescriptors(image)
```

**Returns:** A array of object with the descriptor (`array[].descriptor`) and the description. (`array[].description`)


## *async function:* facerec.labeledfacedescriptor(label, faceimage)
Creates a labeled version of normal face descriptors. An array of labeled face descriptors are fed into `facerec.recognizer()` to create a recognition model.
#### Arguments
- label: A label to attach to the face, usually a name. *Ex: 'Alex'*
- faceimage: A image in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id. (For using a image URL, look to `facerec.getImage()`)
  
**Returns:** A [LabeledFaceDescriptors](https://justadudewhohacks.github.io/face-api.js/docs/classes/labeledfacedescriptors.html) object


## *async function:* facerec.recognizer(arraylabeledfacedescriptor, threshold)
Creates the facial recognition model.
#### Arguments
- arraylabeledfacedescriptor: Array of [LabeledFaceDescriptors](#-LabeledFaceDescriptors) objects. (Either from a array created by the `toLabeledFaceDescriptors()` function on a [`FaceRecDataset`](#-FaceRecDataset) or from a array created by objects returned from `facerec.labeledfacedescriptor()`)
- threshold: The minimum confidence needed to return a result. A value from 0 (100% confidence) to 1 (0% confidence) is required. *Ex: 0.3 for 70%* 

**Returns:** A [FaceRecRecognizer](#-FaceRecRecognizer) object


## *async function:* facerec.drawResults(results,image,overlay)
An internal function used to visualize the results of a face detection. 

## *async function:* facerec.createOverlay(element)
An internal function used to create an overlay in visualizing the results of a face detection. 


# Reference

## FaceRecDataset
A helper class designed to easily create a dataset of images with labels, and turn it into an array of labeled face descriptors.

#### Constructor
```new FaceRecDataset()```  
There are no arguments to the constructor.

#### Properties
- images: Contains an array of objects with the label and images.

#### Methods
- `addImageURL(label,imageurl)`: Accepts a label and image url and adds it to the dataset.
- `addImages(arrayoflabeledimages,custominterpreter)`: Accepts an array of images and adds it to the dataset. (See [Adding images to the dataset](#-Adding-images-to-the-dataset) for a working example)
  - Unless a custom interpreter is used, it will assume there is an array of objects with the format of a `label` and `imageurl` properties.
  - If a custom interpreter is provided, the function provided will be called for each element in the array, and an object is to be returned with the `label` and `imageurl` properties.
- `toLabeledFaceDescriptors()`: Converts the dataset into an array of labeled face descriptors. *Note: This is an async function.*



## FaceRecRecognizer
A facial recognition model.

#### Constructor
```new FaceRecRecognizer(arraylabeledfacedescriptor,threshold)```  
*Meant to be constructed from `facerec.recognizer()`.*

#### Properties
- facematcher: The [FaceMatcher object from face-api.js](https://justadudewhohacks.github.io/face-api.js/docs/classes/facematcher.html)

#### Static Methods
- `fromJSON(json)`: Constructs a `FaceRecRecognizer` object from a saved JSON file. (Saved from `FaceRecRecognizer.toJSON()`)
- `fromFaceMatcher(facematcher)`: Constructs a `FaceRecRecognizer` object from a [FaceMatcher class from faceapi.js.](https://justadudewhohacks.github.io/face-api.js/docs/classes/facematcher.html)

#### Methods
- `recognizeImage(faceimage)`: Recognizes the faces in an image and returns an array of the detected faces and their predicted matched names.
  - The `faceimage` argument must be in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id. (For using a image URL, look to `facerec.getImage()`)
  - For an example, see [Using the recognizer](#-Using-the-recognizer).
- `matchOneFace(facedescriptor)`: Gets the label that is the most similar to the face descriptor that is provided. Accepts a Float32Array face descriptor, like the one returned from `facerec.facedescriptor()`. Usually used as an internal function, but could be useful.
- `matchAllFaces(facedescriptors)`: Gets closest labels for all the faces that are present in the face descriptors that are provided. Accepts an array of Float32Array face descriptors, like the one returned from `facerec.facedescriptors()`. Usually used as a internal function, but could be useful.
- `toJSON()`: Outputs the recognition model in the form of a JSON output. This can be saved and imported using the `FaceRecRecognizer.fromJSON()` static function.


## FaceRecWebcam
A helper class to make it easier to accomplish facial recognition on a live webcam feed.

#### Constructor
```
new FaceRecWebcam(recognizer)
```
- **recognizer:** A [FaceRecRecognizer](#-FaceRecRecognizer) object
#### Properties
*None*

#### Methods
- `createWebcam(containerquery)`: Creates a webcam window and overlay automatically. If you wish to use a custom webcam window and overlay, use `FaceRecWebcam.customWebcam()`.
  - The `containerquery` argument requires a valid selector query for the container of the webcam. (Such as the one used in `document.querySelector` or jQuery) 
- `customWebcam(webcamoverlay,webcamvideo)`: Set a custom webcam overlay and webcam window. Both arguments should be an HTML element.
- `startWebcamRecognition(updaterate)`: Starts recognizing and visualizing facial recognition on the webcam every \*`updaterate`\* milliseconds.
  - The `updaterate` arguments sets the number of milliseconds between every update of the webcam. The default is set to 100.
- `webcamRecognize()`: Does a manual recognition of the current frame on the webcam and visualizes it. This is the function that is called by `startWebcamRecognition()`.



## facerec.debug
True or false boolean setting for debug messages in the console. When enabled, it will display a lot of console messages. To help with it, console messages are displayed in a collapsed group, but when debug is enabled errors may get hidden within the collapsed groups, so please be careful of that.
#### Usage
```js
facerec.debug = true // On
facerec.debug = false // Off
```

