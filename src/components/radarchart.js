// 참고자료
// https://yangdanny97.github.io/blog/2019/03/01/D3-Spider-Chart

class RadarChart {
    constructor(svgId, data) {
        // svg 설정
        this.svg = d3.select(svgId);
        this.width = this.svg.node().getBoundingClientRect().width;
        this.height = this.width * 0.95;
        this.svg.attr("height", this.height)
            .attr("transform", `translate(0, ${this.width * 0.05 / 2})`);

        // 데이터
        this.data = data["user"];
        this.conceptNum = this.data[0][0]["state_GKT"].length;
        this.conceptList = [...Array(this.conceptNum).keys()].map(d => { return `C${d+1}`});
        // 문제별 전체 학생의 평균 knowledge state
        this.stateAverage = data["average_exer"];

        // 선택된 학생 ID, 문제 ID, 개념 ID, KT model
        this.targetUser = 0;
        this.targetExer = 0;
        this.targetConcept = -1;
        this.targetModel = "GKT";
    };

    init() {
        this.base = this.svg.append("g")
        this.container = this.svg.append("g");
        this.legend = this.svg.append("g");

        // Radar 반지름
        this.radialScale = d3.scaleLinear().domain([0, 1]).range([0, this.width * 0.43]);
        // Area 색상
        this.areaColorScale = d3.scaleOrdinal().domain([...Array(8).keys()]).range(d3.schemeSet2);//Pastel2)
        // Concept 색상
        this.conceptColorScale = d3.scaleOrdinal().domain(this.conceptList).range(d3.schemeCategory10);//Tableau10)

        // 방위각에 따른 좌표를 계산하는 함수
        this.getRadarCoord = (idx, scale) => {
            let angle = (Math.PI / 2) + (2 * Math.PI * idx / this.conceptNum);
            let x = Math.cos(angle) * this.radialScale(scale);
            let y = Math.sin(angle) * this.radialScale(scale);
            return [this.width / 2 + x, this.height / 2 - y];
        };
        // Area를 그리는 path를 계산하는 함수
        this.getAreaPath = (d) => {
            let points = [...new Array(this.conceptNum)]
            d.forEach((value, idx) => points[idx] = this.getRadarCoord(idx, value));
            return points
        };

        // Radar 그리기
        let ticks = [0.2, 0.4, 0.6, 0.8, 1.0];
        let radarTicks = ticks.map(d => [...Array(this.conceptNum).fill(d)])
        this.base.selectAll("polygon.radar")
            .data(radarTicks)
            .join("polygon")
            .attr("class", "radar")
            .attr("points", this.getAreaPath)
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-dasharray", d => (d[0] === 1.0) ? "" : "3,3");
        // Radar 원 ver.
        // this.base.selectAll("circle")
        //     .data(ticks)
        //     .join("circle")
        //     .attr("cx", this.width / 2)
        //     .attr("cy", this.height / 2)
        //     .style("r", this.radialScale)
        //     .style("fill", "none")
        //     .style("stroke", "black")
        //     .style("stroke-dasharray", d => (d === 1.0) ? "" : "3,3");
        // Radar Label 붙이기
        this.base.selectAll("text.tick")
            .data(ticks)
            .join("text")
            .attr("class", "tick fs-6 fw-light")
            .attr("x", this.width / 2 + 3)
            .attr("y", d => this.height / 2 - this.radialScale(d) - 3)
            .text(d => d)
            .style("display", d => (d === 1.0) ? "none" : "block");
        // Radar Axis 그리기
        this.base.selectAll("line.radar")
            .data(Array(this.conceptNum).keys())
            .join("line")
            .attr("class", "radar")
            .attr("x1", this.width / 2)
            .attr("y1", this.height / 2)
            .attr("x2", d => this.getRadarCoord(d, 1)[0])
            .attr("y2", d => this.getRadarCoord(d, 1)[1])
            .style("stroke", "grey");
        
        this._drawAxis(this.targetConcept);
    };

    update(user, exer, concept, model) {
        this.targetUser = user;
        this.targetExer = exer;
        this.targetConcept = concept;
        this.targetModel = model;
        // Area 업데이트
        let drawData = {"Total Average": this.stateAverage[this.targetExer][`state_${this.targetModel}`], 
                        [`Student ` + (this.targetUser+1)]: this.data[this.targetUser][this.targetExer][`state_${this.targetModel}`]};
        this._drawAxis(this.targetConcept);
        this._drawArea(drawData);
        this._displayExer([this.targetExer]);
    };

    _drawAxis(targetConcept) {
        // Radar Axis Label 붙이기
        this.base.selectAll("rect.axis")
            .data(this.conceptList)
            .join("rect")
            .transition()
            .attr("class", d => d === `C${targetConcept}` ? "axis target" : "axis")
            .attr("x", d => this.getRadarCoord(this.conceptList.indexOf(d), 1.1)[0] - 15)
            .attr("y", d => this.getRadarCoord(this.conceptList.indexOf(d), 1.1)[1] + 10 - 22)
            .attr("width", "30")
            .attr("height", "30")
            .attr("rx", "5")
            .style("fill", this.conceptColorScale);
        this.base.selectAll("text.axis")
            .data(this.conceptList)
            .join("text")
            .attr("class", d => d === `C${targetConcept}` ? "axis fs-5 fw-bold" : "axis fs-5")
            .text(d => d)
            .attr("text-anchor", "middle")
            .attr("x", d => this.getRadarCoord(this.conceptList.indexOf(d), 1.1)[0])
            .attr("y", d => this.getRadarCoord(this.conceptList.indexOf(d), 1.1)[1] + 10)
            .style("fill", d => d === `C${targetConcept}` ? "white" : this.conceptColorScale(d));
    };

    _drawArea(drawData) {
        let legendList = Object.keys(drawData);
        let areaList = [...Array(legendList.length)];
        legendList.forEach((key, idx) => {
            areaList[idx] = drawData[key];
        });
        // Area 그리기
        this.container.selectAll("polygon.area")
            .data(areaList)
            .join("polygon")
            .transition()
            .attr("class", "area")
            .attr("points", this.getAreaPath)
            .style("fill", d => this.areaColorScale(areaList.indexOf(d)))
            .style("fill-opacity", 0.5)
            .style("stroke", d => this.areaColorScale(areaList.indexOf(d)))
            .style("stroke-width", "3");
        
        // Area Legend
        let legendScale = d3.scaleOrdinal().domain(legendList).range(d3.schemeSet2);//Pastel2);
        this.legend
        .call(d3.legendColor().scale(legendScale))
        .attr("transform", `translate(${this.width / 25}, ${this.height / 25})`)
        .attr("class", "fw-light")
        .style("display", "inline")
        .style("scale", "1.1");
    };

    _displayExer(targetExer) {
        d3.select("#knowledge-state-p")
            .data(targetExer)
            .join("p")
            .attr("class", "text-center fs-5 fw-semibold py-3 mb-1")
            .text(d => `Knowledge State on Exercise ${d+1}`);
    };
};