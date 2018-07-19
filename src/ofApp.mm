#include "ofApp.h"
//--------------------------------------------------------------
ofApp :: ofApp (ARSession * session){
    ARFaceTrackingConfiguration *configuration = [ARFaceTrackingConfiguration new];
    
    [session runWithConfiguration:configuration];
    
    this->session = session;
}

ofApp::ofApp(){}

//--------------------------------------------------------------
ofApp :: ~ofApp () {
}

vector <ofPrimitiveMode> primModes;
int currentPrimIndex;

//--------------------------------------------------------------
void ofApp::setup() {
    ofBackground(127);
    ofSetFrameRate(60);
    ofEnableDepthTest();

    int fontSize = 8;
    if (ofxiOSGetOFWindow()->isRetinaSupportedOnDevice())
        fontSize *= 2;

    processor = ARProcessor::create(session);
    processor->setup();
    
    ofSetFrameRate(60);
    
    verandaFont.load("fonts/verdana.ttf", 30);
}

//--------------------------------------------------------------
void ofApp::update(){
    processor->update();
    processor->updateFaces();
}

float smileValueTo255(float smileValue) {
    return ofMap(smileValue, -1.5, 1.5, 0, 255);
}

void drawEachTriangle(ofMesh faceMesh, float smileValue = 1) {
    ofPushStyle();
    const auto uniqueFaces = faceMesh.getUniqueFaces();
    const int uniqueFacesSize = uniqueFaces.size();
    for (int i = 0; i < uniqueFacesSize; ++i) {
        auto face = uniqueFaces[i];
        // Three possible ways to color the face, try changing it up!
        ofSetColor(ofColor::fromHsb(smileValueTo255(smileValue) * ofRandomuf(), 225, 200));
//        ofSetColor(ofColor::fromHsb(smileValueTo255(smileValue), 255, 255 * ofNormalize(i, 0, uniqueFacesSize)));
//        ofSetColor(ofColor::fromHsb(smileValueTo255(smileValue), 255, abs(face.getVertex(0).z) * 10 * 255));
        ofDrawTriangle(face.getVertex(0), face.getVertex(1), face.getVertex(2));
    }
    ofPopStyle();
}

void drawFaceCircles(ofMesh faceMesh, float smileValue = 1) {
    ofPushStyle();
    ofSetColor(0, 0, smileValueTo255(smileValue));
    auto verts = faceMesh.getVertices();
    for (int i = 0; i < verts.size(); ++i){
        ofDrawCircle(verts[i] * ofVec3f(1, 1, 1), 0.001);
    }
    ofPopStyle();
}

void ofApp::drawFaceMeshNormals(ofMesh mesh) {
    vector<ofMeshFace> faces = mesh.getUniqueFaces();
    ofMeshFace face;
    ofVec3f c, n;
    ofPushStyle();
    ofSetColor(ofColor::white);
    for(unsigned int i = 0; i < faces.size(); i++){
        face = faces[i];
        c = calculateCenter(&face);
        float absoluteSmileValue = abs(smileValue);
        n = face.getFaceNormal();
        ofDrawLine(c, (c * 1.03) + (n * normalSize * absoluteSmileValue * 0.8));
    }
    ofPopStyle();
}

void ofApp::printInfo() {
    std::string infoString = std::string("Current mode: ") + std::string(bDrawTriangles ? "mesh triangles" : "circles");
    infoString += "\nNormals: " + std::string(bDrawNormals ? "on" : "off");
    infoString += std::string("\n\nTap right side of the screen to change drawing mode.");
    infoString += "\nTap left side of the screen to toggle normals.";
//    infoString += "\n smile value: " + ofToString(smileValue);
    verandaFont.drawString(infoString, 10, ofGetHeight() * 0.85);
}

void ofApp::drawEyeOrbs(FaceAnchorObject& face)
{
    glm::vec4 leftPupil{0, 0, 0, 1};
    glm::vec4 rightPupil{0, 0, 0, 1};
    
    glm::vec4 leftDirection{0, 0, .2, 1};
    glm::vec4 rightDirection{0, 0, .2, 1};
    
    const auto leftEyeMat = ARCommon::toGlmMat4(face.raw.leftEyeTransform);
    leftPupil = leftEyeMat * leftPupil;
    leftDirection = leftEyeMat * leftDirection;
    
    const auto rightEyeMat = ARCommon::toGlmMat4(face.raw.rightEyeTransform);
    rightPupil = rightEyeMat * rightPupil;
    rightDirection = rightEyeMat * rightDirection;
    
    auto vec4to3 = [](const glm::vec4& in)->glm::vec3
    {
        return glm::vec3{in.x, in.y, in.z};
    };
    
    ofSetColor(ofColor::red);
    ofDrawLine(vec4to3(leftPupil), vec4to3(leftDirection));
    ofDrawLine(vec4to3(rightPupil), vec4to3(rightDirection));
    
    double tongueValue = face.getBlendShape(ARBlendShapeLocationTongueOut) * 255.0;
    
    ofSetColor(ofColor(tongueValue, 1.0 - tongueValue, 0));
    const double leftSphereSize = face.getBlendShape(ARBlendShapeLocationMouthSmileLeft) * .02;
    const double rightSphereSize = face.getBlendShape(ARBlendShapeLocationMouthSmileRight) * .02;
    ofDrawSphere(leftDirection, leftSphereSize);
    ofDrawSphere(rightDirection, rightSphereSize);
}

//--------------------------------------------------------------
void ofApp::draw() {
    
    ofDisableDepthTest();
    processor->draw();
    
    camera.begin();
    processor->setARCameraMatrices();

    for (auto & face : processor->getFaces()){
        ofFill();
        ofMatrix4x4 temp = ARCommon::toMat4(face.raw.transform);
        ofPushMatrix();
        ofMultMatrix(temp);
        
        mesh.addVertices(face.vertices);
        mesh.addTexCoords(face.uvs);
        mesh.addIndices(face.indices);
        
        if (bDrawTriangles) {
            drawEachTriangle(mesh, smileValue);
        } else {
            drawFaceCircles(mesh, smileValue);
        }
        
        if (bDrawNormals) {
            drawFaceMeshNormals(mesh);
        }
        
        mesh.clear();
        
        drawEyeOrbs(face);
        
        ofPopMatrix();
        
        if (SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(@"12.0")) {
//            ofLog() << "lookAtPoint: " << ofToString(face.getLookAtPoint());
//            ofPushStyle();
//            ofSetColor(ofColor::red);
//            ofDrawCircle(face.getLookAtPoint(), 0.1);
//            ofPopStyle();
        }
    }
    camera.end();
}

void ofApp::exit() {}

void ofApp::touchDown(ofTouchEventArgs &touch){
    if (touch.x > ofGetWidth() * 0.5) {
        bDrawTriangles = !bDrawTriangles;
    } else if (touch.x < ofGetWidth() * 0.5) {
        bDrawNormals = !bDrawNormals;
    }
}

void ofApp::touchMoved(ofTouchEventArgs &touch){}

void ofApp::touchUp(ofTouchEventArgs &touch){}

void ofApp::touchDoubleTap(ofTouchEventArgs &touch){}

void ofApp::lostFocus(){}

void ofApp::gotFocus(){}

void ofApp::gotMemoryWarning(){}

void ofApp::deviceOrientationChanged(int newOrientation){
    processor->updateDeviceInterfaceOrientation();
    processor->deviceOrientationChanged();
}

void ofApp::touchCancelled(ofTouchEventArgs& args){}
