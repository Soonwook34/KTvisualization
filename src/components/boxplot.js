class BoxPlot {
    constructor(svgId, data) {
        this.margin = {x: 0, y: 0};
        //svg 설정
        this.svg = d3.select(svgId);
        this.width = this.svg.node().getBoundingClientRect().width;
        this.height = this.width;
        this.svg.attr("width", this.width);
        this.svg.attr("height", this.height);

        // 데이터
        this.data = data["average_rate"];
        this.userNum = this.data.length;
        this.conceptNum = this.data[0].length;
        this.conceptList = [...Array(this.conceptNum).keys()].map(d => { return `C${d + 1}`});
        // 개념별 전체 학생의 correct rate 가져오기 및 정렬
        this.rateData = Array.from([...new Array(this.conceptNum)], () => [...new Array(this.userNum)].fill(0));
        this.rateData = this.rateData.map((d, concept_idx) => {
            return d.map((_, exer_idx) => {
                return this.data[exer_idx][concept_idx];
            }).sort(d3.ascending);
        });

        // 선택된 학생 ID, 문제 ID, 개념 ID, KT model
        this.targetUser = 0;
        this.targetExer = 0;
        this.targetConcept = -1;
        this.targetModel = "GKT";
    };

    init() {
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.container = this.svg.append("g");
        
        // Concept 위치
        this.xScale = d3.scaleBand().domain(this.conceptList).range([0, this.width]).padding(0.3);
        // Concept 색상
        this.conceptColorScale = d3.scaleOrdinal().domain(this.conceptList).range(d3.schemeCategory10);//Tableau10);
        // Answer Rate 위치
        this.yScale = d3.scaleLinear().domain([1, 0]).range([0, this.height]);


        // quantile: 4분위수가 아닌 0.4, 0.5, 0.6 범위 사용
        this.quaterList = Array.from([...Array(this.conceptNum)], () => [...Array(3)].fill(0));
        this.quaterList = this.quaterList.map((d, concept_idx) => {
            return d.map((_, quater) => {
                return d3.quantile(this.rateData[concept_idx], 0.4 + quater * 0.1); // (quater + 1) / 4
            });
        });
        // whisker: 박스 길이의 1.5배수가 아닌 1.2배수 사용
        this.minMax = Array.from([...Array(this.conceptNum)], () => [...Array(2)].fill(0));
        this.quaterList.forEach((d, idx) => {
            let interRange = d[2] - d[0];
            this.minMax[idx][0] = Math.max(0.0, d[0] - 1.2 * interRange);
            this.minMax[idx][1] = Math.min(1.0, d[2] + 1.2 * interRange);
        });
        
        this._drawAxis(this.targetConcept);
        this._drawWhisker(this.minMax);
        this._drawBox(this.quaterList, this.targetConcept);
    };

    update(user, concept) {
        this.targetUser = user;
        this.targetConcept = concept;

        this._drawAxis(this.targetConcept);
        this._drawWhisker(this.minMax);
        this._drawBox(this.quaterList, this.targetConcept);
        this._drawTarget(this.data[this.targetUser]);
    };

    _drawAxis(targetConcept) {
        // Concept Axis 그리기
        this.xAxis.selectAll("rect.axis")
            .data(this.conceptList)
            .join("rect")
            .transition()
            .attr("class", d => d === `C${targetConcept}` ? "axis target" : "axis")
            .attr("x", d => this.xScale(d) + this.xScale.bandwidth() * 0.2)
            .attr("y", 4)
            .attr("width", this.xScale.bandwidth() * 0.6)
            .attr("height", 24)
            .attr("rx", "5")
            .style("fill", this.conceptColorScale);
        this.xAxis
            .attr("transform", `translate(${this.margin.x}, ${this.margin.y + this.height})`)
            .call(d3.axisBottom(this.xScale));
        this.xAxis.selectAll("text")
            .data(this.conceptList)
            .join("text")
            .attr("class", d => d === `C${targetConcept}` ? "fs-5 fw-bold" : "fs-5")
            .style("fill", d => d === `C${targetConcept}` ? "white" : this.conceptColorScale(d));
        // Answer Rate Axis 그리기
        this.yAxis
            .attr("transform", `translate(${this.margin.x}, ${this.margin.y})`)
            .call(d3.axisLeft(this.yScale));
        this.yAxis.selectAll("text")
            .attr("class", "fs-6");
    }

    _drawWhisker(minMax) {
        // 메인 whisker 그리기
        this.container.selectAll("line.whisker")
            .data(minMax)
            .join("line")
            .attr("class", "whisker")
            .attr("x1", d => this.xScale(this.conceptList[minMax.indexOf(d)]) + this.xScale.bandwidth() / 2)
            .attr("y1", d => this.yScale(d[0]))
            .attr("x2", d => this.xScale(this.conceptList[minMax.indexOf(d)]) + this.xScale.bandwidth() / 2)
            .attr("y2", d => this.yScale(d[1]))
            .style("stroke", d => this.conceptColorScale(this.conceptList[minMax.indexOf(d)]))
            .style("stroke-width", "2");
            // TODO: 타겟은 굵게
        // whisker의 최소, 최대값 표시
        this.container.selectAll("line.min")
            .data(minMax)
            .join("line")
            .attr("class", "min")
            .attr("x1", d => this.xScale(this.conceptList[minMax.indexOf(d)]))
            .attr("y1", d => this.yScale(d[0]))
            .attr("x2", d => this.xScale(this.conceptList[minMax.indexOf(d)]) + this.xScale.bandwidth())
            .attr("y2", d => this.yScale(d[0]))
            .style("stroke", d => this.conceptColorScale(this.conceptList[minMax.indexOf(d)]))
            .style("stroke-width", "2");
            this.container.selectAll("line.max")
            .data(minMax)
            .join("line")
            .attr("class", "max")
            .attr("x1", d => this.xScale(this.conceptList[minMax.indexOf(d)]))
            .attr("y1", d => this.yScale(d[1]))
            .attr("x2", d => this.xScale(this.conceptList[minMax.indexOf(d)]) + this.xScale.bandwidth())
            .attr("y2", d => this.yScale(d[1]))
            .style("stroke", d => this.conceptColorScale(this.conceptList[minMax.indexOf(d)]))
            .style("stroke-width", "2");
    };

    _drawBox(quaterList) {
        // 사분위수 Box 그리기
        this.container.selectAll("rect.background")
            .data(quaterList)
            .join("rect")
            .attr("class", "background")
            .attr("x", d => this.xScale(this.conceptList[quaterList.indexOf(d)]))
            .attr("y", d => this.yScale(d[2]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.yScale(d[0]) - this.yScale(d[2]))
            .style("fill", "white");
        this.container.selectAll("rect.box")
            .data(quaterList)
            .join("rect")
            .attr("class", "box")
            .attr("x", d => this.xScale(this.conceptList[quaterList.indexOf(d)]))
            .attr("y", d => this.yScale(d[2]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.yScale(d[0]) - this.yScale(d[2]))
            .style("fill", d => this.conceptColorScale(this.conceptList[quaterList.indexOf(d)]))
            .style("fill-opacity", 0.5)
            .style("stroke", d => this.conceptColorScale(this.conceptList[quaterList.indexOf(d)]))
            .style("stroke-width", "2");
        // 중간값 Line 그리기
        this.container.selectAll("line.median")
            .data(quaterList)
            .join("line")
            .attr("class", "median")
            .attr("x1", d => this.xScale(this.conceptList[quaterList.indexOf(d)]))
            .attr("y1", d => this.yScale(d[1]))
            .attr("x2", d => this.xScale(this.conceptList[quaterList.indexOf(d)]) + this.xScale.bandwidth())
            .attr("y2", d => this.yScale(d[1]))
            .style("stroke", d => this.conceptColorScale(this.conceptList[quaterList.indexOf(d)]))
            .style("stroke-width", "2");
    };

    _drawTarget(target) {
        // target user 그리기
        let user = [...Array(this.conceptNum).keys()].map(d => { return [d, target[d]]});
        this.container.selectAll("circle.target")
            .data(user)
            .join("circle")
            .transition()
            .attr("class", "target")
            .attr("cx", d => this.xScale(this.conceptList[d[0]]) + this.xScale.bandwidth() / 2)// + Math.random() * this.xScale.bandwidth())
            .attr("cy", d => this.yScale(d[1]))
            .style("r", "7")
            .style("fill", d => this.conceptColorScale(this.conceptList[d[0]]))
            .style("stroke", "black")
            .style("stroke-width", "3");
        // 모든 user 그리기
        // this.data.forEach((user, idx) => {
        //     this.container.selectAll(`circle.user-${idx}`)
        //         .data(user)
        //         .join("circle")
        //         .attr("class", `user-${idx}`)
        //         .attr("cx", d => this.xScale(this.conceptList[user.indexOf(d)]) + Math.random() * this.xScale.bandwidth())
        //         .attr("cy", this.yScale)
        //         .style("r", "3")
        //         .style("fill", "none")
        //         .style("stroke", d => this.conceptColorScale(this.conceptList[user.indexOf(d)]))
        //         .style("stroke-widdth", 2);
        // })
    };
};