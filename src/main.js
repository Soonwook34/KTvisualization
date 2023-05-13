// 데이터 관련
let data, userNum, exerNum, conceptNum, models;
// 시각화 관련
let boxPlot, radarChart, heatmap;
// 선택된 학생 ID, 문제 ID, 개념 ID, KT model
let targetUser, targetExer, targetConcept, targetModel;

let init = () => {
    targetUser = 0;
    targetExer = 0;
    targetConcept = 0;
    targetModel = "GKT";

    boxPlot = new BoxPlot("#box-svg", data);
    boxPlot.init();

    radarChart = new RadarChart("#radar-svg", data);
    radarChart.init();

    heatmap = new Heatmap("#heatmap-svg", data);
    heatmap.init();

    updateAll();
};

let updateBoxPlot = () => {
    boxPlot.update(targetUser, targetConcept);
};

let updateRadarChart = () => {
    radarChart.update(targetUser, targetExer, targetConcept, targetModel);
};

let updateHeatmap = () => {
    heatmap.update(targetUser, targetExer, targetConcept, targetModel);
};

let updateAll = () => {
    updateBoxPlot();
    updateRadarChart();
    updateHeatmap();
};

d3.json("https://raw.githubusercontent.com/Soonwook34/KTvisualization/main/data/naive_c5_q50_s4000_v0.json")
    .then(jsonData => {
        // 데이터 가져오기
        data = jsonData;
        // 학생, 문제, 개념 수 구하기
        userNum = data["user"].length;
        exerNum = data["average_exer"].length;
        conceptNum = data["average_exer"][0]["state_GKT"].length;
        models = ["DKT", "GKT"];

        // console.log(data);
        init();

        // 학생 ID 선택 메뉴 추가
        let userIdSelect = document.getElementById("user-id-select");
        data["user"].forEach((_, idx) => {
            let option = document.createElement("option");
            option.innerHTML = idx + 1;
            if (idx === targetUser) option.setAttribute("selected", "");
            userIdSelect.appendChild(option);
        });
        // 학생 ID 선택 버튼 이벤트
        d3.select("#user-id-btn").on("click", (e) => {
            e.preventDefault();
            targetUser = userIdSelect.options[userIdSelect.selectedIndex].innerHTML - 1;
            console.log(targetUser);
            updateAll();
            // TODO:
        });

        // KT model 선택 메뉴 추가
        let modelSelect = document.getElementById("model-select");
        models.forEach(model => {
            let option = document.createElement("option");
            option.innerHTML = model;
            if (model === targetModel) option.setAttribute("selected", "");
            modelSelect.appendChild(option);
        });
        // KT model 선택 메뉴 추가
        d3.select("#model-btn").on("click", (e) => {
            e.preventDefault();
            targetModel = modelSelect.options[modelSelect.selectedIndex].innerHTML
            console.log(targetModel);
            updateAll();
            // TODO:
        });
        
        heatmap.container.selectAll("rect.btn").on("click", (e) => {
            e.preventDefault();
            targetExer = e.target.__data__["exer"];
            updateAll();
        });

        heatmap.container.selectAll("rect.btn").on("mouseover", (e) => {
            e.preventDefault();
            targetConcept = e.target.__data__["concept"].substr(1);
            updateAll();
        });

        heatmap.container.selectAll("rect.btn").on("mouseout", (e) => {
            e.preventDefault();
            targetConcept = -1;
            updateAll();
        });
    });