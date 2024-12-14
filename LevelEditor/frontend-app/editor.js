$(function () {
    let blockCounter = 0;
    const serverName = "http:localhost:3000";

    $("#add-block").click(function () {
        createBlock("block", 10, 10);
    });

    $("#add-block2").click(function () {
        createBlock("block2", 10, 10);
    });


    $("#add-pigs").click(function () {
        createBlock("pigs", 10, 10);
    });

    $("#add-triangle").click(function () {
        createBlock("triangle", 10, 10);
    });

    function createBlock(type, top, left) {
        const blockId = `block-${blockCounter++}`
        //create a div
        const block = $("<div></div>")
            .addClass(type)
            .attr("id", blockId)
            .css({ top: top, left: left })
            .appendTo("#editor");

        block.draggable({
            containment: "#editor",
            //triggered when you stop dragging box around
            stop: function (even, ui) {
                //you can add stuff here
            }
        });

        block.click(function (event) {
            event.stopPropagation();
        });

        block.contextmenu(function (event) {
            event.preventDefault();
            if (confirm("Delete this block?")) {
                $(this).remove();
            };
        });
    }

    function clearLevel() {
        $("#editor").
            children().remove();
    }

    function loadLevelList() {
        $.ajax({
            url:  "http:localhost:3000/levels",
            method: "GET",
            success: function (levelIds) {
                const $levelList = $("#level-list")
                $levelList.empty();
                $levelList.append('<option value="">Select a Level</option>');
                levelIds.forEach(function (id) {
                    $levelList.append(`<option value="${id}">${id}</option>`)
                });
            },
            error: function (xhr, status, error) {
                console.error("Error fetching level list:", error);
            }
        });
    };

    //rename level
    $("#rename-level").click(function () {
        const levelId = $("#level-list").val();
        //const levelName = $("#level-id").val().trim();

        if (!levelId) {
            alert("Please choose a level ID to replace!");
            return;
        }

        let popup = prompt("Enter new level name:", "New Level");
        var newName = "";

        if (popup == null) {
            return;
        } else if (popup == "") {
            alert("Please enter a valid new level ID");
            return;
        } else {
            newName = popup.trim();
        }

        $.ajax({
            url: serverName + `level/` + encodeURIComponent(levelId),
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify({ name: `${newName}` }),
            success: function (response) {
                 alert(response)
                 loadLevelList();
            },
            error: function (xhr, status, error) {
                alert("Error renaming level " + xhr.responseText);
            }
        });

    });

    //delete
    $("#delete-level").click(function () {
        const levelId = $("#level-list").val();

        if (!levelId) {
            alert("Please choose a level ID!");
            return;
        }
        if (confirm(`Delete level ${levelId}?`)) {
            $.ajax({
                url: serverName + `level/` + encodeURIComponent(levelId),
                method: "DELETE",
                contentType: "application/json",
                success: function (response) {
                    clearLevel()
                    loadLevelList();

                },
                error: function (xhr, status, error) {
                    alert("Error deleting level" + xhr.responseText);
                }
            });
        }
    });

    //clear screen
    $("#clear-level").click(function () {
        clearLevel()
    });

    //START
    $("#game-start").click(function () {
        const numList = $("#level-list option").length;

        if (numList > 1) {
            window.location.href = "game.html";
        } else {
            alert("Please make at least one level!");
            return;
        }
    });


    //saving
    $("#save-level").click(function () {
        const levelId = $("#level-id").val().trim();

        if (!levelId) {
            alert("Please enter a level ID!");
            return;
        }

        if($(".pigs").length == 0)
        {
            alert("Please add at least one pig!");
            return;
        }

        const levelData = [];

        //saving different types and adding to level data
        $(".block").each(function () {
            const $this = $(this);
            const position = $this.position();
            levelData.push({
                id: $this.attr("id"),
                x: position.left,
                y: position.top,
                width: $this.width(),
                height: $this.height(),
                type: "block"
            });
        });
        $(".block2").each(function () {
            const $this = $(this);
            const position = $this.position();
            levelData.push({
                id: $this.attr("id"),
                x: position.left,
                y: position.top,
                width: $this.width(),
                height: $this.height(),
                type: "block2"
            });
        });
        $(".pigs").each(function () {
            const $this = $(this);
            const position = $this.position();
            levelData.push({
                id: $this.attr("id"),
                x: position.left,
                y: position.top,
                width: $this.width(),
                height: $this.height(),
                type: "pigs"
            });
        });
        $(".triangle").each(function () {
            const $this = $(this);
            const position = $this.position();
            levelData.push({
                id: $this.attr("id"),
                x: position.left,
                y: position.top,
                width: $this.width(),
                height: $this.height(),
                type: "triangle"
            });
        });

        if (levelData.length === 0) {
            alert("The level is empty. Add some blocks before saving.");
            return;
        };

        $.ajax({
            url: serverName + `level/` + encodeURIComponent(levelId),
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(levelData),
            success: function (response) {
                alert(response);
                loadLevelList();
            },
            error: function (xhr, status, error) {
                alert("Error saving level" + xhr.responseText);
            }
        });
    });

    //loading
    $("#load-level").click(function () {
        const levelId = $("#level-list").val();

        if (!levelId) {
            alert("Please choose a level ID!");
            return;
        }
        console.log(levelId)

        $.ajax({
            url: serverName + `level/` + encodeURIComponent(levelId),
            method: "GET",
            contentType: "application/json",
            success: function (response) {

                const parsedData = JSON.parse(response);

                if (confirm(`Load level ${levelId}?`)) {
                    clearLevel()

                    for (let i = 0; i < parsedData.length; i++) {

                        const newType = parsedData[i]["type"];
                        const newY = parsedData[i]["y"];
                        const newX = parsedData[i]["x"];

                        createBlock(newType, newY, newX)
                    }
                }
            },
            error: function (xhr, status, error) {
                alert("Error loading level" + xhr.responseText);
            }
        });
    });

    loadLevelList();

});