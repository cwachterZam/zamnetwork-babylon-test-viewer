window.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('renderCanvas');
    var engine = new BABYLON.Engine(canvas, true);
    engine.loadingUIText = "Zam 3d Viewer Loading Data...";
    engine.displayLoadingUI();
    if (engine.scenes.length !== 0) {
        for (s in engine.scenes) {
            s.dispose();
            s = null;
        }
    }
    
    var addObject = function(tgtData, scene) {
        var hdrTexture = new BABYLON.Texture("HDR_CloudySky.png", scene);
        var geoPromise = $.ajax(tgtData.model);
        for (t in tgtData.textures) {
            if (tgtData.textures[t].name == 'albedo') {
                var albedoTexture = new BABYLON.Texture(tgtData.textures[t].url, scene);
            }
        }
        geoPromise.then(function(serializedData) {
            var data = JSON.parse(serializedData);
            //console.log("Got geo data: " + JSON.stringify(data));
            for (objName in data) {
                // console.log("Name: " + objName);
                // console.log(data[objName]);
                // console.log(data[objName].model);

                var obj = new BABYLON.Mesh(objName + "Opaque", scene);
                obj.position = new BABYLON.Vector3(0, 0, 0);

                //mesh.setVerticesData(kind, data, updatable, stride)
                obj.setVerticesData(BABYLON.VertexBuffer.PositionKind, data[objName].model.P, false, 3);
                obj.setPositionsForCPUSkinning();
                obj.setVerticesData(BABYLON.VertexBuffer.NormalKind, data[objName].model.N, false, 3);
                obj.setNormalsForCPUSkinning();

                obj.setVerticesData(BABYLON.VertexBuffer.UVKind, data[objName].model.uv, false, 2);
                obj.setIndices(data[objName].model.indices);

                obj.setVerticesData("rest", data[objName].model.P, false, 3);
                var objCopy = obj.clone(objName + "Translucent");

                ////

                // ////////console.log(obj);
                obj.material = new BABYLON.ShaderMaterial(objName + "OpaqueMaterial", scene, "./lolUber",
                                                          {needAlphaBlending: false,
                                                           attributes: ["position", "uv", "normal", "rest"],
                                                           uniforms: ["world", "worldView", "worldViewProjection", "cameraPosition"]});

                obj.material.setTexture("albedoTexture", albedoTexture);
                obj.material.setTexture("hdrTexture", hdrTexture);
                obj.material.backFaceCulling = false;
                obj.material.setFloat("opaque", 1.0);

                objCopy.material = new BABYLON.ShaderMaterial(objName + "OpaqueMaterial", scene, "./lolUber",
                                                          {needAlphaBlending: true,
                                                           attributes: ["position", "uv", "normal", "rest"],
                                                           uniforms: ["world", "worldView", "worldViewProjection", "cameraPosition"]});

                objCopy.material.setTexture("albedoTexture", albedoTexture);
                objCopy.material.setTexture("hdrTexture", hdrTexture);
                objCopy.material.backFaceCulling = true;
                objCopy.material.setFloat("opaque", 0.0);
            }
        },
        // fail handler:
        function() {
            console.log("Problem retrieving data?");
        })
    }

        
    var createScene = function() {
        var scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.ArcRotateCamera('camera1', 3.14159 / 2.0, 3.14159 / 2.0, 400, new BABYLON.Vector3(0, 0, 0), scene);
        camera.setTarget(new BABYLON.Vector3(0, 100, 0));
        camera.attachControl(canvas, true);
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

        // Assume that some magic UI (TBD...) has determined that I want:
        //   Champion: "Aatrox"
        //   Skin: "Aatrox"
        var p1 = $.ajax("http://staging.threedasset.services.zam.com/v1/asset/game/LoL/character/Aatrox");  // MAGIC #1
        p1.then(function(data) {
                    for (s in data) {
                        if (data[s].skin_name == 'Aatrox') {  // MAGIC #2
                            addObject(data[s], scene);
                        }
                    }
                },
                function() {
                    console.log("Problem retrieving data?");
                })
        return scene;
    }
    
    var scene = createScene();
    scene.debugLayer.show();
    console.log(scene);
    engine.hideLoadingUI();
    engine.runRenderLoop(function() {
        // Why doesn't Babylon.js provide this?
        for (var i = 0; i < scene.meshes.length; i++) {
            var mesh = scene.meshes[i];
            if (mesh.skeleton) {
                mesh.applySkeleton(mesh.skeleton);
            }
            mesh.computeWorldMatrix();
            var tmpWorld = mesh.getWorldMatrix();
            var tmpView = scene.activeCamera.getViewMatrix();
            var tmpWorldView = tmpWorld.multiply(tmpView);
            var tmpTransposeWorldView = BABYLON.Matrix.Transpose(tmpWorldView);
            var tmpInverseTransposeWorldWiew = tmpTransposeWorldView.invert();
            mesh.material.setMatrix("inverseTransposeWorldView", tmpInverseTransposeWorldWiew);
        }
        scene.render();
    });
    window.addEventListener('resize', function() {
        engine.resize();
    });

});
