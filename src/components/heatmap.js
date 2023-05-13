class Heatmap {
    constructor(svgId, data) {
        this.marginContainer = {x: 40, y: 40};
        this.padding = 0.15

        // 데이터
        this.data = data["user"];
        this.conceptNum = this.data[0][0]["state_GKT"].length;
        this.conceptList = [...Array(this.conceptNum).keys()].map(d => { return `C${d + 1}`});
        this.exerNum = this.data[0].length;
        this.exerList = [...Array(this.exerNum).keys()]

        // svg 설정
        this.svg = d3.select(svgId);
        this.height = this.svg.node().getBoundingClientRect().width / 5 + this.marginContainer.y;
        // TODO: padding 계산
        this.width = (this.height - this.marginContainer.y) / (this.conceptNum + this.padding * (this.conceptNum - 1) / this.conceptNum)
                     * (this.exerNum + (this.exerNum - 1) / this.exerNum * this.padding) + this.marginContainer.x;
        this.svg.attr("height", this.height);
        this.svg.attr("width", this.width);

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
        this.container.attr("transform", `translate(${this.marginContainer.x}, 10)`);

        // Concept 위치
        this.xScale = d3.scaleBand()
            .domain(this.exerList)
            .range([0, this.width - this.marginContainer.x])
            .padding(this.padding);
        // Answer Rate 위치
        this.yScale = d3.scaleBand()
            .domain(this.conceptList)
            .range([0, this.height - this.marginContainer.y])
            .padding(this.padding);
        // Concept 색상
        this.conceptColorScale = d3.scaleOrdinal().domain(this.conceptList).range(d3.schemeCategory10);//Tableau10);

        this._drawAxis();
    };

    update(user, exer, concept, model) {
        this.targetUser = user;
        this.targetExer = exer;
        this.targetConcept = concept;
        this.targetModel = model;

        // 데이터 가공
        let userData = [...new Array(this.conceptNum * this.exerNum)].fill(0);
        this.data[user].forEach((d, exer_idx) => {
            d[`state_${this.targetModel}`].forEach((state, concept_idx) => {
                let idx = exer_idx * this.conceptNum + concept_idx;
                userData[idx] = {"exer": exer_idx, "concept": `C${concept_idx + 1}`, 
                                 "state": state, 
                                 "skill": `C${d["skill_id"] + 1}`,
                                 "correct": d["correct"]};
            });
        });
        
        this._drawAxis();
        this._drawHeatmap(userData);
        this._addButton(userData);
    }

    _drawAxis() {
        //축 설정
        this.xAxis.selectAll("text.x-axis")
            .data(this.exerList)
            .join("text")
            .transition()
            .attr("class", d => d === this.targetExer ? "x-axis fs-6 fw-bold" : "x-axis fs-6")
            .attr("x", d => this.xScale(d) + this.xScale.bandwidth() + this.marginContainer.x / 2 + 5)
            .attr("y", this.height - 5)
            .text(d => d + 1)
            .attr("text-anchor", "middle");
        this.yAxis.selectAll("text.y-axis")
            .data(this.conceptList)
            .join("text")
            .transition()
            .attr("class", d => d === `C${this.targetConcept}` ? "y-axis fs-5 fw-bold" : "y-axis fs-5")
            .attr("x", "0")
            .attr("y", d => this.yScale(d) + this.yScale.bandwidth())
            .text(d => d)
            .style("fill", this.conceptColorScale);
    };

    _drawHeatmap(userData) {
        // Heatmap cell 배경
        this.container.selectAll("rect.background")
            .data([0])
            .join("rect")
            .attr("class", "background")
            .attr("x", d => "-5")
            .attr("y", d => "-5")
            .attr("width", this.width - this.marginContainer.x + 10)
            .attr("height", this.height - this.marginContainer.y + 10)
            .attr("rx", "10")
            .style("fill", "rgb(68, 84, 106")
            .style("fill-opacity", "0.05");
        this.container.selectAll("rect.backcell")
            .data(userData)
            .join("rect")
            .attr("class", "backcell")
            .attr("x", d => this.xScale(d["exer"]))
            .attr("y", d => this.yScale(d["concept"]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("rx", "5")
            .style("fill", "white");
        
        // Heatmap 선택 문제 표시
        this.container.selectAll("rect.exer")
            .data([this.targetExer])
            .join("rect")
            .attr("class", "exer")
            .transition()
            .attr("x", d => this.xScale(d) - this.xScale.bandwidth() * this.padding / 2)
            .attr("y", this.yScale.bandwidth() * this.padding / 2)
            .attr("width", this.xScale.bandwidth() + this.xScale.bandwidth() * this.padding)
            .attr("height", this.height - this.marginContainer.y - this.yScale.bandwidth() * this.padding)
            .attr("rx", "8")
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-width", "2");
        
        // Heatmap cell 그리기
        this.container.selectAll("rect.cell")
            .data(userData)
            .join("rect")
            .attr("class", "cell")
            .attr("x", d => this.xScale(d["exer"]))
            .attr("y", d => this.yScale(d["concept"]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("rx", "5")
            .transition()
            .style("fill", d => this.conceptColorScale(d["concept"]))
            .style("fill-opacity", d => d["state"]);
        // 정오답 쓰기
        this.container.selectAll("text.cell")
            .data(userData)
            .join("text")
            .attr("class", "cell fs-4 fw-bold")
            .attr("x", d => this.xScale(d["exer"]) + this.xScale.bandwidth() / 2)
            .attr("y", d => this.yScale(d["concept"]) + this.yScale.bandwidth() / 1.3)
            .text(d => d["skill"] === d["concept"] ? (d["correct"] === 1 ? "✔" : "✘") : "")
            .attr("text-anchor", "middle")
            .style("fill", "white");
            // .style("stroke", d => this.conceptColorScale(d["concept"]))
            // .style("stroke-width", "1");
    };

    _addButton(userData) {
        // 상호작용 박스 만들기
        this.container.selectAll("rect.btn")
            .data(userData)
            .join("rect")
            .attr("class", "btn")
            .attr("x", d => this.xScale(d["exer"]))
            .attr("y", d => this.yScale(d["concept"]))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .attr("rx", "5")
            .style("fill-opacity", "0")
            .style("stroke", d => this.conceptColorScale(d["concept"]));
        // Click 이벤트
        // this.container.selectAll("rect.btn").on("click", (e) => {
        //     e.preventDefault();
        //     this.targetExer = e.target.__data__["exer"];
        // });
        // Hover 이벤트
        // this.container.selectAll("rect.btn").on("mouseover", (e) => {
        //     e.preventDefault();
        //     console.log(e);
        //     console.log(e.target.__data__);
        // });
    };

}