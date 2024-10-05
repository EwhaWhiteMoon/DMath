const Op = {
    not: "not",
    or: "or",
    and: "and",
    xor: "xor",
    cond: "cond",
    bcond: "bcond",
}

const opChar = {
    '∼': Op.not,
    '∧': Op.and,
    '∨': Op.or,
    '⊕': Op.xor,
    '→': Op.cond,
    '↔': Op.bcond,
}

const opOrder = {
    [Op.not]: 2,
    [Op.and]: 3,
    [Op.or]: 4,
    [Op.xor]: 4,
    [Op.cond]: 5,
    [Op.bcond]: 6,
}

const opFunc = {
    [Op.not]: (v) => !v, //사용하지 않음...
    [Op.and]: (lv, rv) => lv && rv,
    [Op.or]: (lv, rv) => lv || rv,
    [Op.xor]: (lv, rv) => lv != rv, //비트 연산에서는 xor 맞음
    [Op.cond]: (lv, rv) => lv != true || rv != false,
    [Op.bcond]: (lv, rv) => lv == rv,
}

const vChar = {
    '𝑃': 0,
    '𝑄': 1,
    '𝑅': 2,
    '∼𝑃': 3,
    '∼𝑄': 4,
    '∼𝑅': 5,
}

function revVChar(vNum) { //변수 숫자를 다시 문자로 바꾸기
    const vChars = Object.keys(vChar); //vChar의 key를 꺼내서
    return vChars[vChars.findIndex(e => vChar[e] == vNum)]; //vNum에 해당하는 key 찾기
}

class treeNode{
    constructor(lv, rv, operator){
        this.lv = lv;
        this.rv = rv;
        this.operator = operator;
    }
    toString(){ // 표 제목 만들 때 스트링 하기
        let lvStr, rvStr;

        if(this.lv instanceof treeNode) lvStr = this.lv.toString(); //lv가 노드면 걔도 toString 하고
        else lvStr = revVChar(this.lv) //아니면(변수면) 변수 숫자를 문자로 바꾸기

        if(this.rv instanceof treeNode) rvStr = this.rv.toString(); //rv도 동일함
        else rvStr = revVChar(this.rv)

        const opChars = Object.keys(opChar); // opChar의 key를 꺼내서
        const opStr = opChars[opChars.findIndex(e => opChar[e] == this.operator)]; //자신의 연산자에 해당하는 키 찾기
        
        return lvStr + ' ' + opStr + ' ' + rvStr; //좌항 + 연산자 + 우항 스트링 반환
    }
    calc(p, q, r){ //p, q, r을 받아서 재귀적 계산한 결과를 반환(bool)
        const variables = [p, q, r, !p, !q, !r];
        let lvDone, rvDone;

        if(this.lv instanceof treeNode) lvDone = this.lv.calc(p, q, r); //lv가 노드면 재귀적으로 calc하고
        else lvDone = variables[this.lv] //변수면 해당하는 p, q, r, not p, not q, not r값 불러오기

        if(this.rv instanceof treeNode) rvDone = this.rv.calc(p, q, r); //rv도 동일함
        else rvDone = variables[this.rv]

        return opFunc[this.operator](lvDone, rvDone);
    }
}

class parser{
    constructor(strToParse){
        //1단계: not 처리(단항 연산자, 우선순위 높으므로 미리), 변수 및 연산자 처리하기 쉬운 형태로 바꾸기.
        const splited = strToParse.split(' ');
        const parsed1 = [];
        this.isUsed = [false, false, false, false, false, false]; //사용되지 않은 변수가 진리표에 나오지 않게 하기 위함
        while(splited.length != 0){
            let cur = splited.shift();
            if(opChar[cur] == Op.not) cur += splited.shift();
            if(cur in vChar){
                parsed1.push(vChar[cur]);

                this.isUsed[vChar[cur]] = true;
                if(vChar[cur] >= 3) this.isUsed[vChar[cur] - 3] = true; //not 들어간 변수만 쓰여도, 원본이 나와야 함.
            }
            if(cur in opChar) parsed1.push(opChar[cur]);  
        }
        console.log(parsed1);

        //2단계: 중위 표현식 전환
        const opStack = [];
        const parsed2 = [];
        for(let i = 0; i < parsed1.length; i++){
            const cur = parsed1[i];

            if(!(cur in Op)){ // 현재 보는 요소가 연산자가 아니면(피연산자이면)
                parsed2.push(cur); //그대로 옮긴다
                continue;
            } //이제 이 아래는 연산자의 처리.

            while(opStack.length != 0){ // 스택이 빌 때까지 반복
                const top = opStack[opStack.length - 1];
                if(opOrder[cur] < opOrder[top]) break; //맨 위의 요소의 우선순위가 자신보다 크면(나중이면) 탈출
                parsed2.push(opStack.pop()); // 아니면 맨 위의 요소를 꺼내서 옮긴다
            }
            opStack.push(parsed1[i]); // 자신을 추가한다
        }
        while(opStack.length != 0) parsed2.push(opStack.pop()); //남은 거 긁어서 넣기
        console.log(parsed2);

        //3단계: 트리로 전환
        const pStack = [];
        this.treeNodes = []; //진리표 작성에 사용할 것.
        for(let i = 0; i < parsed2.length; i++){
            const cur = parsed2[i];

            if(!(cur in Op)){ //피연산자라면 무조건 스택으로
                pStack.push(cur);
                continue;
            } //아래는 연산자 처리

            const rv = pStack.pop(); // 먼저 꺼낸 게 rv임
            const lv = pStack.pop();
            const newNode = new treeNode(lv, rv, cur);
            this.treeNodes.push(newNode);
            pStack.push(newNode) //피연산자 두 개 꺼내서 합치고 스택으로
        }
        console.log(pStack[0]);
        this.tree = pStack[0]; //트리 완성!

        //번외: 진리표에 표시해야 할 것들 만들기.
        //제목이 키, 계산해야 할 값이 값
        this.headings = [];
        Object.keys(vChar).forEach(e => {
            if(this.isUsed[vChar[e]]) // 사용되지 않았다면 안 들어감.
                this.headings.push([e, vChar[e]]);
        }); //기본적인 PQR, not PQR

        this.treeNodes.forEach(e => {
            this.headings.push([e.toString(), e]);
        }) //계산 중간 값 및 마지막 값, 마지막으로 만들어진 노드가 전체 식임(무조건)

        console.log(this.headings)
    }
    getHeading() { //진리표에 표시해야 할 것들 제목
        return this.headings.map((e) => e[0]);
    }
    getCalculatedList(p, q, r){ //p, q, r에 따른 진리표
        const variables = [p, q, r, !p, !q, !r];
        return this.headings.map(e =>{
            if(e[1] instanceof treeNode) return e[1].calc(p, q, r);
            return variables[e[1]];
        }); //계산된 것들의 값 반환(T, F로)
    }
    getCases() { //pqr 조합들의 목록
        //변수가 3가지뿐이니까 간단한 방법 사용.
        //반복문 사용하는 것이 더 간단하고 효율적일 듯...

        let caseList = [[true, false, false]]
        if(this.isUsed[0]) caseList.push([false, false, false])//P가 쓰였으면 p가 false인 경우 추가
        if(this.isUsed[1]){ //Q가 쓰였으면 각 경우마다 Q가 0, 1인 경우 생성
            caseList = caseList.reduce((acc, cur) => {
                acc.push([cur[0], true, cur[2]]);
                acc.push([cur[0], false, cur[2]]);
                return acc;
            } , [])
        }
        if(this.isUsed[2]){ //R도 동일
            caseList = caseList.reduce((acc, cur) => {
                acc.push([cur[0], cur[1], true]);
                acc.push([cur[0], cur[1], false]);
                return acc;
            } , [])
        }
        return caseList
    }
}