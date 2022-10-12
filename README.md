
# facerec.js

A JavaScript package designed specifically for facial recognition. A wrapper of [faceapi.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html) and has a heavy dependency on it.

Compared to faceapi.js, which is centered around several uses, one of them being facial recognition, this package is a more streamlined version with facial recognition in mind.

## Table of Contents
- [facerec.js](#facerecjs)
  - [Table of Contents](#table-of-contents)
- [Getting Started](#getting-started)
  - [Installation](#installation)
    - [Node.js Compatibility](#nodejs-compatibility)
  - [Initialize](#initialize)
- [Guide](#guide)
    - [Creating a dataset](#creating-a-dataset)
    - [Adding images to the dataset](#adding-images-to-the-dataset)
    - [Converting to facial data](#converting-to-facial-data)
    - [Creating the recognizer](#creating-the-recognizer)
    - [Using the recognizer](#using-the-recognizer)
      - [Recognizing a image and "drawing" results](#recognizing-a-image-and-drawing-results)
      - [Getting the raw results from a URL image](#getting-the-raw-results-from-a-url-image)
      - [Recognizing results from a webcam feed](#recognizing-results-from-a-webcam-feed)
- [API](#api)
  - [*async function:* facerec.init(?options)](#async-function-facerecinitoptions)
  - [*async function:* facerec.getImage(imageurl)](#async-function-facerecgetimageimageurl)
  - [*async function:* facerec.facedescriptor(faceimage)](#async-function-facerecfacedescriptorfaceimage)
  - [*async function:* facerec.facedescriptors(faceimage)](#async-function-facerecfacedescriptorsfaceimage)
  - [*async function:* facerec.labeledfacedescriptor(label, faceimage)](#async-function-facereclabeledfacedescriptorlabel-faceimage)
  - [*async function:* facerec.recognizer(arraylabeledfacedescriptor, threshold)](#async-function-facerecrecognizerarraylabeledfacedescriptor-threshold)
  - [*async function:* facerec.resultsImage(results,image,?options)](#async-function-facerecresultsimageresultsimageoptions)
  - [*async function:* facerec.drawResults(results,image,overlay)](#async-function-facerecdrawresultsresultsimageoverlay)
  - [*async function:* facerec.createOverlay(element)](#async-function-facereccreateoverlayelement)
- [Reference](#reference)
  - [FaceRecDataset](#facerecdataset)
  - [FaceRecRecognizer](#facerecrecognizer)
  - [FaceRecWebcam](#facerecwebcam)
  - [facerec.debug](#facerecdebug)
- [FAQ](#faq)
  - [How do I customize the label text in the overlay results?](#how-do-i-customize-the-label-text-in-the-overlay-results)
  - [Do I have to train the model every time the page loads?](#do-i-have-to-train-the-model-every-time-the-page-loads)
  - [How do I save a recognizer?](#how-do-i-save-a-recognizer)
  - [How do I use a saved recognizer?](#how-do-i-use-a-saved-recognizer)
  - [How to fix the libuuid error in Repl.it](#how-to-fix-the-libuuid-error-in-replit)





# Getting Started

## Installation
facerec.js has a dependency on [face-api.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html).
```html
<script src="https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/dist/face-api.js"></script>
<script src="https://cdn.jsdelivr.net/gh/stellasphere/facerec.js@main/facerec.js"></script>
```

### Node.js Compatibility
[View NPM page here](https://www.npmjs.com/package/facerec)

facerec.js has been written with Node.js compatibility in mind, and all that is required to run facerec.js on Node.js is to install it with
```bash
npm install facerec
```

and

```node
const facerec = require("facerec");
```


## Initialize
facerec.js needs to initialize first.

Here are three examples of how to initalize facerec.js
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

[See the full options and docs for the `facerec.init()` function here.](#async-function-facerecinitoptions)

# Guide
This guide will go from start to finish over an example of creating and using a facial recognition model. 

This example will be using the four characters on [the TV show 'The Office'](https://www.peacocktv.com/stream-tv/the-office/characters) Michael, Jim, Dwight, and Pam. 

- [Creating a dataset](#creating-a-dataset)
- [Adding images to the dataset](#adding-images-to-the-dataset)
- [Converting to facial data](#converting-to-facial-data)
- [Creating the recognizer](#creating-the-recognizer)
- [Using the recognizer](#using-the-recognizer)
- [Recognizing a image and "drawing" results](#recognizing-a-image-and-drawing-results)
- [Getting the raw results from a URL image](#getting-the-raw-results-from-a-url-image)


### Creating a dataset
To 'train' the model to recognize faces, you need reference pictures of them. To organize them all, you can create a `FaceRecDataset`.
```
var dataset = new facerec.Dataset()

console.log("created dataset:", dataset)
```

### Adding images to the dataset
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

### Converting to facial data
This step takes the images and turns them into what is called a face descriptor, which are unique points on a person's face that can be used to identify them.
```js
var labeleddescriptors = await dataset.toLabeledFaceDescriptors()

console.log("descriptors:",labeleddescriptors)
```

### Creating the recognizer
Now you can create the recognizer. It requires a threshold value which means the lowest percent confidence the model can have before returning that face. (1 = 0%, 0 = 100%)
```js
var threshold = 0.3 // 70%
var recognizer = await facerec.recognizer(labeleddescriptors,threshold)

console.log("recognizer:",recognizer)
```

### Using the recognizer
Then you can use the recognizer in a variety of different ways.

#### Recognizing a image and "drawing" results
The first option is to have facerec.js overlay a graphic with the results of the facial recognition.
```js
var image = document.querySelector("#theofficeimg")
var imageresults = await recognizer.recognizeImage(image)
facerec.drawResults(imageresults,image)
console.log("image results:",imageresults)
```

Another option for visualizing results is to use the `facerec.resultsImage()` function. This function, as opposed to the other one, creates a brand new image file with the results graphic.

```js
var image = document.querySelector("#theofficeimg")
var result = await recognizer.recognizeImage(image)
console.log("result:",result)

var resultimage = facerec.resultsImage(result,image)
console.log("result image url:",resultimage)
```

> For both these options, you can customize what gets displayed in the label (ex: 'Jim Halpert (100%)') in the option called `overlaytext`.

#### Getting the raw results from a URL image
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

#### Recognizing results from a webcam feed
To perform facial recognition on a webcam feed, you can use the `FaceRecWebcam` helper class.

Start by creating the class and providing it with the recognizer.
```js  
var webcam = new facerec.Webcam(recognizer)
console.log("webcam:",webcam)
```

Then, either have facerec.js create a webcam and overlay or provide a already-created webcam and overlay.
```js
await webcam.createWebcam("#webcamcontainer")
// webcam.customWebcam("#webcamoverlay","#webcamvideo")
```

After that, either perform facial recognition "on-demand" using the `webcamRecognize()` method or intervally using the `startWebcamRecognition()` method.
```js
webcam.webcamRecognize()
webcam.startWebcamRecognition(500) // Replace 500 with how often you want it to perform facial recognition again. 500 means 500ms or 0.5 seconds.
```

# API

## *async function:* facerec.init(?options)
Initalizes facerec.js

**Arguments**
- options: A optional argument for the options of facerec.js

**Example**
```js
await facerec.init({
  modelsurl: "/models",
  TinyFaceDetector: false,
  SsdMobilenetv1: true,
  Mtcnn: false,
  modelpriority: ["SsdMobilenetv1"],
  label: {
    text: function(result) {
      return `${result.label} (${result.percentconfidence}%)`
    }
  }
})
```
**Options**
- **modelsurl:** Location of the directory where the facial recognition models are located.
- **TinyFaceDetector, SsdMobilenetv1, Mtcnn:** Option to load that model
- **modelpriority:** Priority of the model used. If a face can't be detected using the first model, it will try using other models and go down the list.
- **overlaytext:** 
- **label:** An object containing the label settings, which customize the visualization of face recognition results, like in the `facerec.resultsImage()` function and the webcam detection. See below.
- **label.text:** A function that generates the text tags when the recognition results are visualized. For more info, see: [How do I customize the label text in the overlay results?](#how-do-i-customize-the-label-text-in-the-overlay-results)
- **label.linecolor:** The color of the line around the detected face. Also the color of the text background if `label.textbackgroundcolor` is not set. Given as a CSS `color` property value. 
- **label.linewidth:** The width/thickness of the line around the detected face. Given as a integer, not a string, in `px` units. See default option values for more info.
- **label.textbackgroundcolor:** The color of the text background. Defaults to the `label.linecolor` if not set. Given as a CSS `color` property value.
- **label.textcolor:** The color of the text itself. Given as a CSS `color` property value.
- **label.textsize:** The size of the text. Given as a integer, not a string, in `px` units. See default option values for more info.
- **label.textfont:** The font of the text in the label. Given as a CSS `font-family` property value. 
- **label.textpadding:** The amount of padding around the text within the label. Given as a integer, not a string, in `px` units. See default option values for more info.

**Default Options:**
```js
{
  modelsurl: "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights",
  TinyFaceDetector: true,
  SsdMobilenetv1: true,
  Mtcnn: false,
  modelpriority: ["SsdMobilenetv1","TinyFaceDetector"],
  label: {
    text: function(result) {
      return `${result.label} (${result.percentconfidence}%)`
    },
    linecolor: 'rgba(0, 0, 255, 1)',
    linewidth: 2,
    textbackgroundcolor: undefined,
    textcolor: "rgba(255, 255, 255, 1)",
    textsize: 14,
    textfont: "Georgia",
    textpadding: 4 
  }
}
```

**Returns:** None

## *async function:* facerec.getImage(imageurl)
Almost all image inputs in facerec.js are required to be in an HTML `img` element format. *Except the datasets* This function converts a URL into an HTML image element.

**Arguments**
- imageurl: A URL (either relative or absolute URL) for a image.

**Example**
```js
var relativeimage = await facerec.getImage("image.png") // relative
var absoluteimage = await facerec.getImage("https://website.com/image.png") // absolute
```

**Returns:** A [HTMLImageElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) (Links to MDN web docs)


## *async function:* facerec.facedescriptor(faceimage)
Gets the identifying features/characteristics of a face. If there are multiple faces in an image, it will return the one with the highest confidence. If you need to detect multiple faces, use `facerec.facedescriptors()`.  

If you have more than one model specified in `modelpriority`, it will default to the first model, then use subsequent models if a face is not found.

**Arguments**
- faceimage: A image in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id.  (For using a image URL, look to `facerec.getImage()`)

**Example**
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

**Arguments**
- faceimage: A image in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id. (For using a image URL, look to `facerec.getImage()`)

**Example**
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

**Arguments**
- label: A label to attach to the face, usually a name. *Ex: 'Alex'*
- faceimage: A image in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id. (For using a image URL, look to `facerec.getImage()`)
  
**Returns:** A [LabeledFaceDescriptors](https://justadudewhohacks.github.io/face-api.js/docs/classes/labeledfacedescriptors.html) object


## *async function:* facerec.recognizer(arraylabeledfacedescriptor, threshold)
Creates the facial recognition model.

**Arguments**
- arraylabeledfacedescriptor: Array of [LabeledFaceDescriptors](#LabeledFaceDescriptors) objects. (Either from a array created by the `toLabeledFaceDescriptors()` function on a [`FaceRecDataset`](#FaceRecDataset) or from a array created by objects returned from `facerec.labeledfacedescriptor()`)
- threshold: The minimum confidence needed to return a result. A value from 0 (100% confidence) to 1 (0% confidence) is required. *Ex: 0.3 for 70%* 

**Returns:** A [FaceRecRecognizer](#FaceRecRecognizer) object



## *async function:* facerec.resultsImage(results,image,?options)

**Arguments**
- results: A result returned from `FaceRecRecognizer.recognize()`
- image: The image that was used to produce the results. A image in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id. (For using a image URL, look to `facerec.getImage()`)
- options: Optional argument for providing options for customizing the image. (See below)


**Options**

The default options object:
```js
var defaultoptions = {
  drawdetections: true, // Whether to draw the box around detected faces
  drawlandmarks: true, // Whether to draw the landmarks (dots) on the faces
  // Previously, the linewidth and linecolor options were here, but they were moved to the `facerec.init()` options under the `label.linewidth` and `label.linecolor` options.
}
```

> Note: These options do not provide a option to customize the label. That is set using the `overlaytext` option in the initalization.  See: [How do I customize the label text in the overlay results?](#how-do-i-customize-the-label-text-in-the-overlay-results) and [Initialize](#initialize)

**Example**
```js
var resultimageoptions = {
  drawdetections: false,
  drawlandmarks: false
}
var resultimage = facerec.resultsImage(result,image,resultimageoptions)
```



## *async function:* facerec.drawResults(results,image,overlay)
An internal function used to visualize the results of a face detection. 

## *async function:* facerec.createOverlay(element)
An internal function used to create an overlay in visualizing the results of a face detection. 


# Reference

## FaceRecDataset
A helper class designed to easily create a dataset of images with labels, and turn it into an array of labeled face descriptors.

**Constructor**
```new facerec.Dataset()```  
There are no arguments to the constructor.

**Properties**
- images: Contains an array of objects with the label and images.

**Methods**
- `addImageURL(label,imageurl)`: Accepts a label and image url and adds it to the dataset.
- `addImages(arrayoflabeledimages,custominterpreter)`: Accepts an array of images and adds it to the dataset. (See [Adding images to the dataset](#Adding-images-to-the-dataset) for a working example)
  - Unless a custom interpreter is used, it will assume there is an array of objects with the format of a `label` and `imageurl` properties.
  - If a custom interpreter is provided, the function provided will be called for each element in the array, and an object is to be returned with the `label` and `imageurl` properties.
- `toLabeledFaceDescriptors()`: Converts the dataset into an array of labeled face descriptors. *Note: This is an async function.*



## FaceRecRecognizer
A facial recognition model.

**Constructor**
```new facerec.Recognizer(arraylabeledfacedescriptor,threshold)```  
*Meant to be constructed from `facerec.recognizer()`.*

**Properties**
- facematcher: The [FaceMatcher object from face-api.js](https://justadudewhohacks.github.io/face-api.js/docs/classes/facematcher.html)

**Static Methods**
- `fromJSON(json)`: Constructs a `FaceRecRecognizer` object from a saved JSON file. (Saved from `facerec.Recognizer.toJSON()`)
- `fromFaceMatcher(facematcher)`: Constructs a `FaceRecRecognizer` object from a [FaceMatcher class from faceapi.js.](https://justadudewhohacks.github.io/face-api.js/docs/classes/facematcher.html)

**Methods**
- `recognizeImage(faceimage)`: Recognizes the faces in an image and returns an array of the detected faces and their predicted matched names.
  - The `faceimage` argument must be in the form of a HTML image, video or canvas element, a [tf.Tensor3D object](https://js.tensorflow.org/api/latest/#tensor3d) or a string with the element id. (For using a image URL, look to `facerec.getImage()`)
  - For an example, see [Using the recognizer](#Using-the-recognizer).
- `matchOneFace(facedescriptor)`: Gets the label that is the most similar to the face descriptor that is provided. Accepts a Float32Array face descriptor, like the one returned from `facerec.facedescriptor()`. Usually used as an internal function, but could be useful.
- `matchAllFaces(facedescriptors)`: Gets closest labels for all the faces that are present in the face descriptors that are provided. Accepts an array of Float32Array face descriptors, like the one returned from `facerec.facedescriptors()`. Usually used as a internal function, but could be useful.
- `toJSON()`: Outputs the recognition model in the form of a JSON output. This can be saved and imported using the `facerec.Recognizer.fromJSON()` static function.


## FaceRecWebcam
A helper class to make it easier to accomplish facial recognition on a live webcam feed.

**Constructor**
```
new facerec.Webcam(recognizer)
```
- **recognizer:** A [FaceRecRecognizer](#FaceRecRecognizer) object
**Properties**
*None*

**Methods**
- `createWebcam(containerquery)`: Creates a webcam window and overlay automatically. If you wish to use a custom webcam window and overlay, use `facerec.Webcam.customWebcam()`.
  - The `containerquery` argument requires a valid selector query for the container of the webcam. (Such as the one used in `document.querySelector` or jQuery) 
- `customWebcam(webcamoverlay,webcamvideo)`: Set a custom webcam overlay and webcam window. Both arguments should be an HTML element.
- `startWebcamRecognition(updaterate)`: Starts recognizing and visualizing facial recognition on the webcam every \*`updaterate`\* milliseconds.
  - The `updaterate` arguments sets the number of milliseconds between every update of the webcam. The default is set to 100.
- `webcamRecognize()`: Does a manual recognition of the current frame on the webcam and visualizes it. This is the function that is called by `startWebcamRecognition()`.



## facerec.debug
True or false boolean setting for debug messages in the console. When enabled, it will display a lot of console messages. To help with it, console messages are displayed in a collapsed group, but when debug is enabled errors may get hidden within the collapsed groups, so please be careful of that.

**Usage**
```js
facerec.debug = true // On
facerec.debug = false // Off
```

# FAQ

## How do I customize the label text in the overlay results?
You can customize the label text in the options under the one called `text` under the `label` options.

The option works as a function, with whatever it returns coming up as the label.

You can customize it by defining it in the initalization function like so:
```js
facerec.init({
  label: {
    text: function(result) {
      return `This face is ${result.label}`
    }
  }
})
```
> If a facial recognition result gave back the results below into the function above, the label would say "This face is Jim Halpert"

The `result` object has several properties to customize the label: (This is a example with a sample detection of Jim Halpert as the label)
```js
{
  "label": "Jim Halpert",
  "distance": 0,
  "confidence": 1,
  "percentconfidence": 100,
  "description": {
    "detection": {...},
    "landmarks": {...},
    "unshiftedLandmarks": {...},
    "alignedRect": {...},
    "descriptor": {...}
  }
}
```
- `label`: The label/name that was assigned to the face when it was trained.
- `distance`: The computed "distance" between the detected face and the one it was trained on. (0 means a exact match, 1 means a complete mismatch)
- `confidence`: The confidence of the model that it is a match to the one it was trained on. This value is a decimal percentage (1 = 100%, 0.5 = 50%, 0 = 0%)
- `percentageconfidence`: The confidence in percentage form. This value is the `confidence` value multiplied times 100 and rounded.
- `description`: Values provided from face-api.js

## Do I have to train the model every time the page loads?
No. You can save the JSON somewhere and load it in, or run facerec.js in Node.js and start a remote API. 

See: [How do I save a recognizer?](#how-do-i-save-a-recognizer)  
See: [Node.js Compatibility](#nodejs-compatibility)

## How do I save a recognizer?
Using the `recognizer.toJSON()` function. This function turns the recognizer into a raw JSON file, which you can use to "import" into facerec.js. 

```js
var json = recognizer.toJSON()
```
> `recognizer` should be replaced by whatever variable has your facerec.js recognizer.

From there, you can save it as a variable, text file, etc. 

See: [How do I use a saved recognizer?](#how-do-i-use-a-saved-recognizer)  
See: [FaceRecRecognizer](#facerecrecognizer) *Look under methods for `toJSON()`*


## How do I use a saved recognizer? 
Using the `facerec.Recognizer.fromJSON()` function. 

```js
var recognizer = facerec.Recognizer.fromJSON(json)
```
> `json` should be whatever variable has your facerec.js recognizer.

## How to fix the libuuid error in Repl.it
When using facerec.js with Node.js on Repl.it, an error saying something like `Error: libuuid.so.1: cannot open shared object file: No such file or directory` might come up. 

If this happens, you can resolve this issue by modifying the `replit.nix` file.

Start by clicking on the 'Show hidden files' option when you click on the three dot icon in the Files tab of the sidebar. (Upper left corner, next to the buttons to create a new file and create a new folder)

Under config files, open the `replit.nix` file and replace the contents with the following:

```nix
{ pkgs }: {
    deps = [
      pkgs.nodejs-16_x
        pkgs.nodePackages.typescript-language-server
        pkgs.yarn
        pkgs.replitPackages.jest
    ];
    env = {
        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [pkgs.libuuid];
    };
}
```