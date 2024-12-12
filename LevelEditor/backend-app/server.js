const express = require("express");
const bodyParser = require("body-parser");
//fs stands for file system
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());

let levels = {};

//get a level for load
app.get("/level/:id", (req, res) => {
    const levelId = req.params.id;
    const filePath = path.join(__dirname, "levels", `${levelId}.json`);

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading level data:", err);
            return res.status(404).send("Level not found");
        };
        
        res.send(data);
    });
});

//creating levels
app.post("/level/:id", (req, res) => {
    const levelId = req.params.id;
    const filePath = path.join(__dirname, "levels", `${levelId}.json`);
    const levelData = req.body;

    if (!Array.isArray(levelData) || levelData.length === 0) {
        return res.status(400).send("Level data must be a non-empty array");
    };

    //2 is amount of indentations
    fs.writeFile(filePath, JSON.stringify(levelData, null, 2), (err) => {
        if (err) {
            console.error("Error saving level data", err);
            return res.status(500).send("Server error");
        };
        res.status(201).send("Level saved successfully");
    });
});

//put
app.put("/level/:id", (req, res) => {
    const levelId = req.params.id;
    const filePath = path.join(__dirname, "levels", `${levelId}.json`);
    const newName = req.body.name;
    const newPath = path.join(__dirname, "levels", `${newName}.json`);

    fs.rename(filePath, newPath,
        (error) => {
            if (error) {
                // Show the error 
                console.log("Error renaming the file");
            }
            else {
                console.log("File Renamed");
                res.json(newName);
            }
        });  
});

//delete level
app.delete("/level/:id", (req, res) => {
    const levelId = req.params.id;
    const filePath = path.join(__dirname, "levels", `${levelId}.json`);

    fs.unlink(filePath,
        (err => {
            if (err) console.log("Error deleting file");
            else {
                console.log("File deleted");
            }
        }));

    res.json(levelId);

});

//get for all levels for drop down menu
app.get("/levels", (req, res) => {
    fs.readdir("levels", (err, files) => {
        if (err) {
            console.error("Error reading levels directory:", err);
            return res.status(500).send("Server error");
        };

        const levelIds = files
            //find all files that end with json - returns array with files
            .filter(file => file.endsWith(".json"))
            //remove .json from names and end up with array that has only name of files
            .map(file => path.basename(file, ".json"));

        res.json(levelIds);
    });
});

if (!fs.existsSync("levels")) {
    fs.mkdirSync("levels")
};

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
