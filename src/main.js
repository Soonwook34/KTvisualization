// 데이터 관련
let data, userNum, exerNum, conceptNum, models;
// 시각화 관련
let boxPlot, radarChart, heatmap;
// 선택된 학생 ID, 문제 ID, 개념 ID, KT model
let targetUser, targetExer, targetConcept, targetModel;
let timer

let init = () => {
    targetUser = 0;
    targetExer = 0;
    targetConcept = 0;
    targetModel = "GKT";

    boxPlot = new BoxPlot("#box-svg", data);
    boxPlot.init();

    radarChart = new RadarChart("#radar-svg", data);
    radarChart.init();

    heatmap = new Heatmap("#heatmap-svg", "#heatmap-tooltip", data);
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

        init();
        
        // 자동 넘기기 스위치 이벤트
        let tickTock = () => {
            targetExer = (targetExer + 1) % exerNum;
            updateAll();
        };
        let autoSwitch = document.getElementById("auto-switch");
        autoSwitch.addEventListener("change", (_) => {
            if (autoSwitch.checked) {
                tickTock();
                timer = setInterval(tickTock, 1000);
            } else clearInterval(timer);
        });

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
            autoSwitch.checked = false;
            clearInterval(timer);
            updateAll();
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
            targetModel = modelSelect.options[modelSelect.selectedIndex].innerHTML;
            autoSwitch.checked = false;
            clearInterval(timer);
            updateAll();
        });
        
        // Heatmap click 이벤트
        heatmap.container.selectAll("rect.btn").on("click", (e, d) => {
            e.preventDefault();
            targetExer = d["exer"];
            updateAll();
        });

        // Heatmap mouseover 이벤트
        heatmap.container.selectAll("rect.btn").on("mouseover", (e, d) => {
            e.preventDefault();
            targetConcept = d["concept"]?.substr(1);

            // Tooltip 처리
            heatmap.tooltip.style("--bs-tooltip-bg", heatmap.conceptColorScale(d["concept"]));
                
            heatmap.tooltipInner.html(`${d["state"].toFixed(4)}`);
            Popper.createPopper(e.target, heatmap.tooltip.node(), {
                placement: "top",
                modifiers: [{
                    name: "arrow",
                    options: {
                        element: heatmap.tooltipArrow.node()
                    }
                }]
            });
            heatmap.tooltip.style("display", "block");
            
            updateAll();
        });
        // Heatmap mouseout 이벤트
        heatmap.container.selectAll("rect.btn").on("mouseout", (e) => {
            e.preventDefault();
            heatmap.tooltip.style("display", "none");
        });
        heatmap.container.selectAll("rect.background").on("mouseout", (e) => {
            e.preventDefault();
            targetConcept = -1;
            updateAll();
        });
    });