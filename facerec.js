if(typeof global !== 'undefined') {
  global.tf = require('@tensorflow/tfjs-node')
  global.faceapi = require('@vladmandic/face-api')
  global.fetch = require("node-fetch")
  global.canvas = require("canvas")
  global.Canvas = require("canvas").Canvas
  global.Image = require("canvas").Image
  global.ImageData = require("canvas").ImageData
  global.loadImage = require("canvas").loadImage
  faceapi.env.monkeyPatch({ Canvas, Image, ImageData, loadImage, fetch })
}

var facerec = {}

facerec.initalized = false

facerec.debug = false

facerec.options = {
  modelsurl: "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights",
  TinyFaceDetector: false,
  SsdMobilenetv1: true,
  Mtcnn: false,
  modelpriority: ["SsdMobilenetv1"],
  overlaytext: function(result) {
    return `${result.label} (${result.percentconfidence}%)`
  }
}

facerec.init = async function(options) {
  if(facerec.debug) console.groupCollapsed("FaceRec: init")
  
  options = options || {}
  facerec.options = Object.assign(facerec.options,options)
  if(facerec.debug) console.log("init options:",facerec.options)

  
  // LOADING IN MODELS
  var loadedmodels = []
  if(facerec.debug) console.log("modelsurl:",facerec.options.modelsurl)

  // LOADING IN OPTIONAL MODELS
  if(facerec.options.TinyFaceDetector) {
    if(facerec.debug) console.log("loaded model:","TinyFaceDetector")
    await faceapi.loadTinyFaceDetectorModel(facerec.options.modelsurl)
    loadedmodels.push("TinyFaceDetector")
  }
  if(facerec.options.SsdMobilenetv1) {
    if(facerec.debug) console.log("loaded model:","SsdMobilenetv1")
    await faceapi.loadSsdMobilenetv1Model(facerec.options.modelsurl)
    loadedmodels.push("SsdMobilenetv1")
  }
  if(facerec.options.Mtcnn) {
    if(facerec.debug) console.log("loaded model:","Mtcnn")
    await faceapi.loadMtcnnModel(facerec.options.modelsurl)
    loadedmodels.push("Mtcnn")
  }

  if(facerec.debug) console.log("model priority:",facerec.options.modelpriority)
  if(facerec.debug) console.log("loaded models:",loadedmodels)
  for(var model of facerec.options.modelpriority) {
    var modelloaded = (loadedmodels.indexOf(model)) !== -1
    if(facerec.debug) console.log("checking if",model,"is loaded:",modelloaded)
    if(!modelloaded) throw Error("A model in the specified model priority list is not loaded.") 
  }
  
  // LOADING IN REQUIRED MODELS
  await faceapi.loadFaceLandmarkModel(facerec.options.modelsurl)
  await faceapi.loadFaceRecognitionModel(facerec.options.modelsurl)

  
  if(facerec.debug) console.groupEnd("FaceRec: init")

  facerec.initalized = true
}

facerec.getImage = async function(imageurl) {
  if(facerec.debug) console.groupCollapsed("FaceRec: getImage")

  if(facerec.debug) console.log("getting image:",imageurl)

  var image 

  if(typeof global == 'undefined') {
    image = await faceapi.fetchImage(imageurl).catch(async function(err){
    throw Error(`Could not fetch image: ${imageurl}. ${err}`)
  })
  } else {
    image = await canvas.loadImage(imageurl).catch(function(err) {
    throw Error(`Could not fetch image: ${imageurl}. ${err}`)
  })
  }
  
  if(facerec.debug) console.groupEnd("FaceRec: getImage")
  
  return image
}

facerec.facedescriptor = async function(faceimage) {
  if(!facerec.initalized) throw Error("facerec.js not initalized")
  if(facerec.debug) console.groupCollapsed("FaceRec: facedescriptor")

  if(facerec.debug) console.log("image:",faceimage)
  
  // GET FACE DESCRIPTOR
  var facedescription
  for(var modelname of facerec.options.modelpriority) {
    if(facerec.debug) console.log("trying model:",modelname)
    
    var modeloptions = new faceapi[`${modelname}Options`]()
    if(facerec.debug) console.log("model options:",modeloptions)
    
    var currentfacedescription = await faceapi.detectSingleFace(faceimage,modeloptions).withFaceLandmarks().withFaceDescriptor()
    if(facerec.debug) console.log(modelname,"result:",currentfacedescription)

    // IF MODEL PRODUCED FACE, THEN BREAK
    if(!currentfacedescription) {
      if(facerec.debug) console.error(modelname,"did not detect face.","Continuing down model priority.")
      continue;
    } else {
      facedescription = currentfacedescription
      break;
    }
  }

  if(facerec.debug) console.log("face description:",facedescription)
  if (!facedescription) {
    throw new Error(`No Face Found: ${faceimage}`)
  }

  // GET FACE DESCRIPTOR
  var facedescriptor = facedescription.descriptor
  if(facerec.debug) console.log("face descriptor:",facedescriptor)

  if(facerec.debug) console.groupEnd("FaceRec: facedescriptor")
  
  return {descriptor:facedescriptor,description:facedescription}
}

facerec.facedescriptors = async function(faceimage) {
  if(!facerec.initalized) throw Error("facerec.js not initalized")
  if(facerec.debug) console.groupCollapsed("FaceRec: facedescriptors")

  if(facerec.debug) console.log("image:",faceimage)
  
  // GET FACE DESCRIPTOR
  var facedescriptions = await faceapi.detectAllFaces(faceimage).withFaceLandmarks().withFaceDescriptors()
  if(facerec.debug) console.log("face descriptions:",facedescriptions)
  if (!facedescriptions) throw new Error(`No Faces Found: ${faceimage}`)
  var facedescriptors = facedescriptions.map(fd=>{return {
    descriptor: fd.descriptor,
    description: fd
  }})
  if(facerec.debug) console.log("face descriptors:",facedescriptors)

  if(facerec.debug) console.groupEnd("FaceRec: facedescriptors")
  
  return facedescriptors
}

facerec.labeledfacedescriptor = async function(label,faceimage) {
  if(!facerec.initalized) throw Error("facerec.js not initalized")
  if(facerec.debug) console.groupCollapsed("FaceRec: labeledfacedescriptor")
  var facedescriptor = [(await this.facedescriptor(faceimage)).descriptor]
  if(facerec.debug) console.log("face descriptor:",facedescriptor)
  
  var labeledfacedescriptor = new faceapi.LabeledFaceDescriptors(label, facedescriptor)
  if(facerec.debug) console.log("labeled face descriptor:",labeledfacedescriptor)

  if(facerec.debug) console.groupEnd("FaceRec: labeledfacedescriptor")
  return labeledfacedescriptor
}

facerec.recognizer = async function(arraylabeledfacedescriptor,threshold) {
  if(!facerec.initalized) throw Error("facerec.js not initalized")
  if(facerec.debug) console.groupCollapsed("FaceRec: recognizer")

  var recognizer = new faceapi.FaceMatcher(arraylabeledfacedescriptor, threshold)
  if(facerec.debug) console.log("new recognizer:",recognizer)
  
  if(facerec.debug) console.groupEnd("FaceRec: recognizer")
  return (facerec.Recognizer.fromFaceMatcher(recognizer))
}

facerec.drawResults = async function(results,image,overlay){
  if(facerec.debug) console.groupCollapsed("FaceRec: drawResults")

  if(!overlay) {
    var createdoverlay = facerec.createOverlay(image)
    overlay = createdoverlay.overlay
    image = createdoverlay.originalcontent
    if(facerec.debug) console.log("created overlay:",createdoverlay)
  }

  if(facerec.debug) console.log("results:",results)

  var descriptions = results.map(result => {return result.description})
  if(facerec.debug) console.log("descriptions:",descriptions)
  
  var resizeddescriptions = faceapi.resizeResults(descriptions, {
    width: image.offsetWidth,
    height: image.offsetHeight 
  })
  if(facerec.debug) console.log("resized descriptions:",resizeddescriptions)

  overlay.width = image.offsetWidth
  overlay.height = image.offsetHeight
  
  faceapi.draw.drawDetections(overlay, resizeddescriptions)
  faceapi.draw.drawFaceLandmarks(overlay, resizeddescriptions)
  
  results.forEach((match, i) => {
    if(facerec.debug) console.log("match:",match)
    
    const box = resizeddescriptions[i].detection.box
    const text = facerec.options.overlaytext(match)
    const drawBox = new faceapi.draw.DrawBox(box, { label: text })
    
    drawBox.draw(overlay)
  })
  
  if(facerec.debug) console.groupEnd("FaceRec: drawResults")
}

facerec.resultsImage = function(results,image,options) {
  if(facerec.debug) console.groupCollapsed("FaceRec: resultsImage")

  var defaultoptions = {
    drawdetections: true,
    drawlandmarks: true,
    linecolor: 'rgba(0, 0, 255, 1)',
    linewidth: 2
  }

  options = options || {}
  options = Object.assign(defaultoptions,options)
  if(facerec.debug) console.log("results image options:",options)
  
  var resultimage = faceapi.createCanvasFromMedia(image)
  if(facerec.debug) console.log("result canvas:",resultimage)

  var detections = results.map(result => result.description.detection)
  if(facerec.debug) console.log("detections:",detections)
  
  var landmarks = results.map(result => result.description.landmarks)
  if(facerec.debug) console.log("landmarks:",landmarks)
  
  if(options.drawdetections) faceapi.draw.drawDetections(resultimage, detections)
  if(options.drawlandmarks) faceapi.draw.drawFaceLandmarks(resultimage, landmarks)

  results.forEach((result, i) => {
    if(facerec.debug) console.log("result:",result)
    
    const box = result.description.detection.box
    const text = facerec.options.overlaytext(result)

    const drawBox = new faceapi.draw.DrawBox(box, {
      boxColor: options.linecolor,
      lineWidth: options.linewidth,
      label: text
    })
    
    drawBox.draw(resultimage)
  })
  
  if(facerec.debug) console.log("result canvas:",resultimage)

  var image = resultimage.toDataURL()
  if(facerec.debug) console.log("result image:",image)
  
  if(facerec.debug) console.groupEnd("FaceRec: resultsImage")
  return image
}

facerec.createOverlay = function(element) {
  if(facerec.debug) console.groupCollapsed("FaceRec: createOverlay")
  
  element.classList.add("facerec-originalcontent")
  if(facerec.debug) console.log("original element:",element)
  
  var originalcontent = element.outerHTML
  if(facerec.debug) console.log("original content:",originalcontent)

  var newelement = document.createElement("div")
  newelement.innerHTML = `
    <canvas class="facerec-overlay" style="position: absolute;left:0;right:0;"></canvas>
    ${originalcontent}
  `

  if(facerec.debug) console.log("new element:",newelement)

  element.parentNode.replaceChild(newelement,element)
  
  var overlay = newelement.querySelector(".facerec-overlay")
  var originalcontent = newelement.querySelector(".facerec-originalcontent")

  if(facerec.debug) console.log("overlay:",overlay)
  if(facerec.debug) console.log("original content:",originalcontent)
  
  if(facerec.debug) console.groupEnd("FaceRec: createOverlay")
  return {
    overlay,
    originalcontent,
  }
}

facerec.Dataset = class FaceRecDataset {
  constructor() {
    this.images = []
  }
  addImageURL = function(label,imageurl) {
    this.images.push({
      label: label,
      imageurl: imageurl
    })
  }
  addImages = function(arrayoflabeledimages,custominterpreter) {
    if(facerec.debug) console.groupCollapsed("facerec.Dataset: addImages")

    if(facerec.debug) console.log("labeledimages:",arrayoflabeledimages)

    if(facerec.debug) console.groupCollapsed("labeledimagesiterator")
    for(var image of arrayoflabeledimages) {
      var label = image.label
      var imageurl = image.imageurl

      if(facerec.debug) console.log("image:",image,"default label:",label,"default url:",imageurl)
      
      if(custominterpreter) {
        var result = custominterpreter(image)
        if(facerec.debug) console.log("custominterpreter","result:",result)
        
        label = result.label
        imageurl = result.imageurl

        if(!label || !imageurl) console.error("Custom iterpreter not outputing label and or image URLs.","Produced result:",result)
      }
      
      this.addImageURL(label,imageurl)
    }
    if(facerec.debug) console.groupEnd("labeledimagesiterator")
    
    if(facerec.debug) console.groupEnd("facerec.Dataset: addImages")
  }
  toLabeledFaceDescriptors = async function() {
    if(!facerec.initalized) throw Error("facerec.js not initalized")
    if(facerec.debug) console.groupCollapsed("facerec.Dataset: toLabeledFaceDescriptors")
    var arraylabeledfacedescriptors = []

    if(facerec.debug) console.log("images:",this.images)
    for(var image of this.images) {
      if(facerec.debug) console.time("image")
      var faceimage = await facerec.getImage(image.imageurl)
      var labeledfacedescriptor = await facerec.labeledfacedescriptor(image.label,faceimage)
      
      if(facerec.debug) console.log("adding image",image,labeledfacedescriptor)
      
      if(labeledfacedescriptor) {
        arraylabeledfacedescriptors.push(labeledfacedescriptor)
      }
      if(facerec.debug) console.timeEnd("image")
    }
  
    if(facerec.debug) console.groupEnd("facerec.Dataset: toLabeledFaceDescriptors")
    return arraylabeledfacedescriptors
  } 
}

facerec.Recognizer = class FaceRecRecognizer {
  constructor(arraylabeledfacedescriptor,threshold) {
    if(facerec.debug) console.groupCollapsed("facerec.Recognizer: constructor")
  
    var recognizer = new faceapi.FaceMatcher(arraylabeledfacedescriptor, threshold)
    if(facerec.debug) console.log("new recognizer:",recognizer)
    
    if(facerec.debug) console.groupEnd("facerec.Recognizer: constructor")
    
    this.facematcher = recognizer
  }
  static fromFaceMatcher(facematcher) {
    return new facerec.Recognizer(facematcher.labeledDescriptors,facematcher.distanceThreshold)
  }
  static fromJSON(savedjson) {
    var facematcher = faceapi.FaceMatcher.fromJSON(savedjson)
    var recognizer = facerec.Recognizer.fromFaceMatcher(facematcher)
    return recognizer
  }
  matchOneFace = function(facedescription) {
    if(!facerec.initalized) throw Error("facerec.js not initalized")
    if(facerec.debug) console.groupCollapsed("facerec.Recognizer: matchOneFace")
    
    var facematcher = this.facematcher
    if(facerec.debug) console.log("facematcher:",facematcher)

    var facedescriptor = facedescription.descriptor
    var facedescription = facedescription.description
    if(facerec.debug) console.log("face descriptor:",facedescriptor)
    if(facerec.debug) console.log("face description:",facedescription)

    var result = facematcher.findBestMatch(facedescriptor)
    if(facerec.debug) console.log("recognition results:",result)

    var confidence = 1 - result.distance
    var finalresult = {
      label: result.label,
      distance: result.distance,
      confidence: confidence,
      percentconfidence: (Math.round(confidence*100)),
      description: facedescription
    }
    if(facerec.debug) console.log("final result:",finalresult)
    
    if(facerec.debug) console.groupEnd("facerec.Recognizer: matchOneFace")
    return finalresult
  }
  matchAllFaces = function(facedescriptors) {
    if(!facerec.initalized) throw Error("facerec.js not initalized")
    if(facerec.debug) console.groupCollapsed("facerec.Recognizer: matchAllFaces")

    if(facerec.debug) console.log("face descriptions:",facedescriptors)
    
    const results = facedescriptors.map(fd => {
      if(facerec.debug) console.groupCollapsed("face description")
      
      if(facerec.debug) console.log("face description:",fd)

      var result = this.matchOneFace(fd)      
      if(facerec.debug) console.log("result:",result)
      
      if(facerec.debug) console.groupEnd("face description")
      return result
    })
    if(facerec.debug) console.log("recognition results:",results)
    
    if(facerec.debug) console.groupEnd("facerec.Recognizer: matchAllFaces")
    return results
  }
  recognizeImage = async function(faceimage) {
    var faces = await facerec.facedescriptors(faceimage)
    var results = await this.matchAllFaces(faces)
    return results
  }
  toJSON = function() {
    var json = this.facematcher.toJSON()
    return json
  }
}

facerec.Webcam = class FaceRecWebcam {
  constructor(recognizer) {
    if(!(recognizer instanceof facerec.Recognizer)) throw Error("Not a FaceRecRecognizer")

    this.recognizer = recognizer
  }
  createWebcam = async function(containerquery) {
    this.webcamcontainer = document.querySelector(containerquery)
    webcamcontainer.innerHTML = `
    <div> 
      <canvas class="facerec-webcamoverlay" style="position: absolute;left:0;right:0;"></canvas>
      <video autoplay="true" class="facerec-webcam"></video>
    </div>
    `
    this.webcamoverlay = webcamcontainer.querySelector(".facerec-webcamoverlay")
    this.webcamvideo = webcamcontainer.querySelector(".facerec-webcam")
    
    if (navigator.mediaDevices.getUserMedia) {
      var stream = await navigator.mediaDevices.getUserMedia({ video: true })
      .catch(function (err) {
        console.error("Webcam could not be activated:",err);
      });
      this.webcamvideo.srcObject = stream;
    } else {
      console.error("No accessible webcam found")
    }
  }
  customWebcam = function(webcamoverlay,webcamvideo) {
    this.webcamoverlay = webcamoverlay
    this.webcamvideo = webcamvideo
  }
  startWebcamRecognition = function(updaterate) {
    if(!this.webcamoverlay) throw Error("No webcam overlay created")
    if(!this.webcamvideo) throw Error("No webcam created")
    if(!this.recognizer) throw Error("No recognzier model")


    if(facerec.debug) console.log("recognizer:",this.recognizer)
    if(facerec.debug) console.log("webcam video:",this.webcamvideo)

    updaterate = updaterate || 100
    if(facerec.debug) console.log("starting webcam recognition every:",updaterate)
    setInterval(this.webcamRecognize.bind(this), updaterate)
  }
  webcamRecognize = async function(){
    if(facerec.debug) console.groupCollapsed("facerec.Webcam: webcamRecognize")
    
    var results = await this.recognizer.recognizeImage(this.webcamvideo)
    facerec.drawResults(results,this.webcamvideo,this.webcamoverlay)
    
    if(facerec.debug) console.groupEnd("facerec.Webcam: webcamRecognize")
  }
}

if(typeof global !== 'undefined') {
  module.exports = facerec
}