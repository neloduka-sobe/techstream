/**
 * All the data code for the fuel guage novel visualization, note that css styles are required so make sure not to delete if you change anything here.
 */

//I sourced this data from OECD webiste - https://data-explorer.oecd.org/vis?bp=true&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_AIR_TRANSPORT%40DF_AIR_TRANSPORT&df[ag]=OECD.SDD.NAD.SEEA&df[vs]=1.0&hc[Topic]=&pg=0&snb=23&tm=private%20climate&utm_source=chatgpt.com&dq=AUS%2BAUT%2BBEL%2BCAN%2BCHL%2BCOL%2BCRI%2BCZE%2BDNK%2BEST%2BFIN%2BDEU%2BGRC%2BHUN%2BISL%2BIRL%2BISR%2BITA%2BJPN%2BKOR%2BLVA%2BLTU%2BLUX%2BMEX%2BNLD%2BNZL%2BNOR%2BPOL%2BPRT%2BSVK%2BSVN%2BESP%2BSWE%2BCHE%2BTUR%2BGBR%2BUSA%2BAFG%2BALB%2BDZA%2BAGO%2BATG%2BARG%2BARM%2BAZE%2BBHS%2BBHR%2BBGD%2BBRB%2BBLR%2BBLZ%2BBEN%2BBTN%2BBOL%2BBIH%2BBWA%2BBRA%2BBRN%2BBGR%2BBFA%2BBDI%2BCPV%2BKHM%2BCMR%2BCAF%2BTCD%2BCHN%2BCOM%2BCOG%2BCOK%2BCIV%2BHRV%2BCUB%2BCYP%2BPRK%2BCOD%2BDJI%2BDMA%2BDOM%2BECU%2BEGY%2BSLV%2BGNQ%2BERI%2BETH%2BFJI%2BGAB%2BGMB%2BGEO%2BGHA%2BGRD%2BGTM%2BGIN%2BGNB%2BHTI%2BHND%2BHKG%2BIND%2BIDN%2BIRN%2BIRQ%2BJAM%2BJEY%2BJOR%2BKAZ%2BKEN%2BKIR%2BKWT%2BKGZ%2BLAO%2BLBN%2BLSO%2BLBR%2BLBY%2BMAC%2BMDG%2BMWI%2BMYS%2BMDV%2BMLI%2BMLT%2BMHL%2BMRT%2BMUS%2BFSM%2BMDA%2BMNG%2BMNE%2BMAR%2BMOZ%2BMMR%2BNAM%2BNRU%2BNPL%2BNIC%2BNER%2BNGA%2BMKD%2BOMN%2BPAK%2BPLW%2BPAN%2BPNG%2BPRY%2BPER%2BPHL%2BQAT%2BROU%2BRUS%2BRWA%2BKNA%2BLCA%2BVCT%2BWSM%2BSMR%2BSTP%2BSAU%2BSEN%2BSRB%2BSYC%2BSGP%2BSLB%2BSOM%2BZAF%2BLKA%2BSDN%2BSUR%2BSYR%2BTWN%2BTJK%2BTZA%2BTHA%2BTLS%2BTGO%2BTON%2BTTO%2BTUN%2BTKM%2BUGA%2BUKR%2BARE%2BURY%2BUZB%2BVUT%2BVEN%2BVNM%2BYEM%2BZMB%2BZWE%2BFRA.A....._T.RES_TOTAL.EMISSIONS_SEEA&pd=2024%2C2024&to[TIME_PERIOD]=false&vw=br


/* This is the method condaining all of the data we use for the guage in the pollution metrics*/
const pollutionData = [

    {
        //this is the bottom right of the fuel guage, and we go around counter clockwise
        //for each I did the top three airlines by flights in that country.
        //data for pollution is rounded to nearest million tonnes
        id: 'segment5', 
        country: 'United States',
        pollution: '210 Mt CO2 equivalent',
        pollutionValue: 210,
        rank: 1,
        nodes: [
            { name: "American Airlines", type: "commercial", rank: 1 },
            { name: "Delta Air Lines", type: "commercial", rank: 2 },
            { name: "United Air Lines", type: "commercial", rank: 3 }
        ]

    },
    {
        id: 'segment4', 
        country: 'China',
        pollution: '108 Mt CO2 equivalent',
        pollutionValue: 108,
        rank: 2,
        nodes: [
            { name: "China Southern Airlines", type: "commercial", rank: 1 },
            { name: "China Eastern Airlines", type: "commercial", rank: 2 },
            { name: "Air China", type: "commercial", rank: 3 }
        ]
    },
    {
        id: 'segment3',
        country: 'UAE',
        pollution: '45 Mt CO2 equivalent',
        pollutionValue: 45,
        rank: 3,
        nodes: [
            { name: "Emirates", type: "commercial", rank: 1 },
            { name: "Etihad Airways", type: "commercial", rank: 2 },
            { name: "Air Arabia", type: "commercial", rank: 3 }
        ]
    },
    {
        id: 'segment2',
        country: 'United Kingdom',
        pollution: '34 Mt CO2 equivalent',
        pollutionValue: 34,
        rank: 4,
        nodes: [
            { name: "Ryanair", type: "commercial", rank: 1 },
            { name: "British Airways", type: "commercial", rank: 2 },
            { name: "easyJet", type: "commercial", rank: 3 }
        ]
    },
    {
        id: 'segment1', 
        country: 'Turkey',
        pollution: '25 Mt CO2 equivalent',
        pollutionValue: 25,
        rank: 5,
        nodes: [
            { name: "Turkish Airlines", type: "commercial", rank: 1 },
            { name: "Pegasus Airlines", type: "commercial", rank: 2 },
            { name: "SunExpress", type: "commercial", rank: 3 }
        ]
    }


];

/* Start of the creation of the actual fuel guage
* created the fuel guage using my own designs on figma, and then copied the paths into the d3 path drawer for svgs. */


//global variables for the visualization states
let currentActiveNetwork = null;
let forceSimulation = null;
let networkContainer = null;
let mainSvg = null;
let wrapperDiv = null;
let currentView = 'gauge'; //differentiate betweent the 'gauge' or 'network' displaying the airlines.


//initialization for the interactiivty for the fuel guage
function initFuelGaugeInteractivity() {

    //remove any existing content for clutter or bugs to start fresh
    d3.select('#fuel-gauge-assembly').selectAll('*').remove();
    
    //now create the main svg for the fuel guage
    const container = d3.select('#fuel-gauge-assembly');
    
    //Adjust so there is a minimum size, with additional responsive ness if screen sizes dont fit.
    const svgWidth = Math.min(800, window.innerWidth - 50); 
    const svgHeight = Math.min(600, window.innerHeight * 0.8); 
    
    //wrapper that contains the space for the visualization and the subitite, will make it easier to transfer once code with others is merged
    wrapperDiv = container.append('div')
        .style('position', 'relative')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center')
        .style('width', '100%')
        .style('min-height', '600px')
        .style('flex-direction', 'column');
    
    //handle the subtitles here
    //assuming the merging background is white color black text for now, might adjust later
    const subtitle = wrapperDiv.append('p')
        .attr('class', 'fuel-gauge-subtitle')
        .style('text-align', 'center')
        .style('color', '#000000ff')
        .style('font-size', '20px')
        .style('font-weight', '400')
        .style('margin', '20px 20px 20px 20px') //margin on all side to be safe can change if not needed
        .text('2024 Air Transport Pollution Data (rounded to nearest million tonnes)');

    wrapperDiv.append('p')
        .attr('class', 'fuel-gauge-subtitle-2')
        .style('text-align', 'center')
        .style('color', '#000000b3')
        .style('font-size', '13px')
        .style('font-weight', '400')
        .style('margin', '20px 20px 20px 20px') //margin on all side to be safe can change if not needed
        .text('Hover for details or Click for another view.');
    
    /* actual creation for main fuel guage viz */
    mainSvg = wrapperDiv.append('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox', '-100 -100 940 918') //extra space around for later use with the dragable network
        .attr('class', 'fuel-gauge-main')
        .style('max-width', '100%')
        .style('height', 'auto')
        .style('display', 'block');

    const segments = mainSvg.selectAll('path.segment')
        .data(pollutionData)
        .enter()
        .append('path')
        .attr('class', 'segment')
        .attr('id', d => d.id)
        .attr('d', d => getSegmentPath(d.id)) //here is wehre I handled the actual drawing process from my svg drawn paths
        .attr('stroke', 'black') //TODO: Adjust if needed for white background on actual prject page.
        .attr('stroke-width', 3)
        .attr('fill', d => getSegmentColor(d.id)) //TODO: Change this, choose better colors or gradients
        .style('cursor', 'pointer');
    
    /* This is the gas pump svg drawing stuff, sourced from public domain gas pump svg drawing*/
    const gasPump = mainSvg.append('g')
        .attr('class', 'gas-pump');
    
    gasPump.append('path')
        .attr('d', 'M447.668 243.157C448.04 243.306 448.371 243.501 448.689 243.753C448.772 243.822 448.841 243.891 448.91 243.96C452.897 246.588 456.884 249.56 459.781 253.141C462.982 257.1 464.762 261.68 463.686 267.108C463.23 269.38 462.196 271.366 460.623 273.122C459.491 274.373 458.112 275.474 456.484 276.438C456.401 278.194 456.373 279.916 456.373 281.626C456.387 283.818 456.47 286.079 456.622 288.397C456.967 293.837 457.946 299.322 458.926 304.762C459.974 310.615 461.023 316.422 461.299 322.47C461.671 330.217 460.568 336.587 457.491 341.085C454.069 346.112 448.509 348.797 440.314 348.556C430.533 348.407 424.517 343.84 421.799 335.404C419.426 328.025 419.785 317.49 422.475 304.234C422.393 293.733 420.751 285.78 417.495 280.421C415.37 276.92 412.487 274.602 408.845 273.5V342.256C410.031 342.726 411.107 343.369 412.018 344.138C414.115 345.882 415.425 348.304 415.425 350.967V357.829C415.425 359.562 413.729 360.974 411.645 360.974H314.78C312.697 360.974 311 359.562 311 357.829V350.967C311 348.304 312.311 345.894 314.408 344.138C315.056 343.599 315.787 343.117 316.574 342.715V236.638C316.574 232.047 318.823 227.881 322.451 224.863C326.08 221.845 331.088 219.974 336.606 219.974H388.729C394.262 219.974 399.297 221.856 402.94 224.886C406.582 227.916 408.845 232.105 408.845 236.718V266.97C415.55 268.187 420.668 271.756 424.228 277.609C428.049 283.887 429.953 292.884 430.008 304.533C430.008 304.716 429.995 304.9 429.953 305.072H429.967C427.415 317.547 427.001 327.279 429.098 333.786C430.85 339.261 434.547 342.221 440.466 342.29H440.535C445.585 342.428 448.937 340.89 450.91 337.987C453.242 334.567 454.056 329.322 453.738 322.711C453.476 317.111 452.441 311.407 451.42 305.669C450.427 300.137 449.434 294.56 449.061 288.707C448.91 286.4 448.827 284.047 448.813 281.614C448.799 279.686 448.841 277.781 448.937 275.91C441.887 270.769 437.596 265.627 436.272 260.509C435.016 255.654 436.341 250.995 440.411 246.542C437.307 244.775 434.147 243.329 430.947 242.17C426.573 240.586 422.075 239.518 417.495 238.899C415.439 238.623 414.046 237.005 414.377 235.295C414.708 233.585 416.653 232.426 418.709 232.701C423.897 233.402 428.987 234.607 433.968 236.408C438.673 238.13 443.239 240.345 447.668 243.157ZM401.284 270.734C401.119 270.344 401.036 269.931 401.077 269.495C401.105 269.185 401.174 268.898 401.284 268.623V236.718C401.284 233.849 399.863 231.232 397.587 229.339C395.31 227.445 392.165 226.263 388.716 226.263H336.606C333.185 226.263 330.067 227.434 327.804 229.316C325.541 231.198 324.134 233.792 324.134 236.638V341.326H401.284V270.734ZM405.395 347.891C405.285 347.902 405.189 347.902 405.078 347.902H321.016C320.547 348.074 320.119 348.315 319.761 348.614C319.03 349.222 318.574 350.06 318.574 350.989V354.708H407.879V350.989C407.879 350.071 407.424 349.234 406.692 348.614C406.32 348.304 405.878 348.063 405.395 347.891ZM342.787 235.743H383.404C385.515 235.743 387.432 236.454 388.812 237.613C388.909 237.694 389.005 237.774 389.088 237.866C390.316 239.002 391.061 240.494 391.061 242.112V263.665C391.061 265.421 390.206 267.016 388.812 268.164C387.432 269.311 385.515 270.034 383.404 270.034H342.787C340.69 270.034 338.786 269.311 337.393 268.164L337.379 268.175C335.999 267.028 335.13 265.432 335.13 263.676V242.112C335.13 240.356 335.985 238.761 337.379 237.613C337.475 237.533 337.572 237.453 337.682 237.384C339.048 236.362 340.842 235.743 342.787 235.743ZM383.404 242.032H342.787C342.773 242.032 342.759 242.032 342.759 242.032L342.732 242.055C342.718 242.066 342.704 242.089 342.704 242.101V263.654C342.704 263.665 342.718 263.688 342.732 263.699V263.722C342.746 263.734 342.759 263.734 342.787 263.734H383.404C383.418 263.734 383.445 263.722 383.459 263.711C383.473 263.699 383.487 263.676 383.487 263.665V242.112C383.487 242.101 383.487 242.089 383.487 242.089L383.459 242.066C383.445 242.043 383.431 242.032 383.404 242.032ZM446.412 250.387C443.777 253.325 442.894 256.263 443.667 259.224C444.591 262.804 447.806 266.614 453.159 270.643C453.697 270.241 454.18 269.816 454.58 269.369C455.421 268.439 455.987 267.349 456.222 266.109C456.939 262.483 455.711 259.373 453.504 256.641C451.683 254.369 449.144 252.292 446.412 250.387Z')
        .attr('fill', '#dc2626') //TODO: Consider adjusting this color
        .attr('stroke', '#ffffffff')
        .attr('stroke-width', 1);
    



    /* Handling for F letter creation, svg path based on public domain F letter edited by myself*/
    const fGroup = mainSvg.append('g')
        .attr('class', 'f-letter');

    //each part of the letter is split into different paths, this was how it was made when I got the svg.

    const fGroupColor = '#000000ff'; //easier to change with a variable for all parts

    fGroup.append('path')
        .attr('id', 'f-letter-1')
        .attr('d', 'M620.883 553.63H673.118')
        .attr('stroke', fGroupColor) 
        .attr('stroke-width', 9)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
    
    fGroup.append('path')
        .attr('id', 'f-letter-2')
        .attr('d', 'M620.883 608.474H654.944')
        .attr('stroke', fGroupColor)
        .attr('stroke-width', 9)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
        
    fGroup.append('path')
        .attr('id', 'f-letter-3')
        .attr('d', 'M620.883 553.63V663.318')
        .attr('stroke', fGroupColor)
        .attr('stroke-width', 9)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
    



    /* Handling for E letter creation, svg path based on public domain F letter edited by myself*/
    const eGroup = mainSvg.append('g')
    .attr('class', 'e-letter');


    const eGroupColor = '#000000ff'; //easier to change with a variable for all parts

    eGroup.append('path')
        .attr('id', 'e-letter-1')
        .attr('d', 'M80.7857 654.044H132.786')
        .attr('stroke', eGroupColor)
        .attr('stroke-width', 8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
        
    eGroup.append('path')
        .attr('id', 'e-letter-2')
        .attr('d', 'M80.7857 544H132.786')
        .attr('stroke', eGroupColor)
        .attr('stroke-width', 8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
        
    eGroup.append('path')
        .attr('id', 'e-letter-3')
        .attr('d', 'M80.7857 598.498H114.214')
        .attr('stroke', eGroupColor)
        .attr('stroke-width', 8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
        
    eGroup.append('path')
        .attr('id', 'e-letter-4')
        .attr('d', 'M80.7857 544V654.044')
        .attr('stroke', eGroupColor)
        .attr('stroke-width', 8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');
    



    /* Tool tip stuff handled here */
    const tooltip = d3.select('#country-tooltip'); //TODO" fix this usage, currently not added, had to adjust.
    

    /* creation for force drag layout here, inspired from D3 Chapter 13 textbook drag mechanics */
    // want to maintain same svg sizes
    networkContainer = wrapperDiv.append('svg')
        .attr('class', 'network-overlay')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox', '-100 -100 940 918')  //WARNING: We use same svg size as the fuel guage, if change do both.
        .style('position', 'absolute')
        .style('top', '0')
        .style('left', '0')
        .style('pointer-events', 'none')
        .style('z-index', 10); //may need to adjust



    //handle the stroke and other styling for each letter at once, kind of redundant but I found it easier to use.
    //TODO: note that color isnt handled here, its handled in the separate letters themselves, might change later
    styleLetters();



    //TODO: GO BACK AND EDIT, TOOL TIP NOT FUNCTIONAL YET
    /* Here I handled the segment data and going back and forth between guage and network
    * might want to do this differently and adjust the return buttons, but for now here. */

    segments.each(function(d, i) { //mote d is the data for each segment of the fuel guage, ie country stuff
        
        // Add hover and click event listeners using D3
        d3.select(this)
            .style('cursor', 'pointer')
            .on('mouseenter', function(event) {

                if (!currentActiveNetwork || currentActiveNetwork !== d.id) {
                    highlightSegment(d3.select(this));
                    showCountryInfo(d, event);
                    

                }

            })
            .on('mousemove', function(event) {

                if (!currentActiveNetwork || currentActiveNetwork !== d.id) {

                    updateTooltipPosition(event);

                }
                
            })
            .on('mouseleave', function() {

                if (!currentActiveNetwork || currentActiveNetwork !== d.id) {

                    hideCountryInfo();
                    unhighlightSegment(d3.select(this));

                }

            })
            .on('click', function(event) {
                unhighlightSegment(d3.select(this)); //make sure to unhighlight on click
                hideCountryInfo(); //hide any tool tip info
                event.stopPropagation(); //prevent any uninteded stuff from happening
                transitionToNetworkView(d); //here we handle the actual transition to the netwrok view of airlines

            });


    });
    


    //After initailization is complete, this line make sure we are set on guage being the initial view.
    currentView = 'gauge';



}


/* This subsection of code contains the color and path data for the fuel guage segments */

//to make things simple I stored all the segment paths from my grouped svg drawing here.
//this function is used when creating each segment for the fuel guage, letters and gas pump handled eslewhere.
function getSegmentPath(segmentId) {

    const paths = {

        'segment1': 'M230.5 298.474H85.5C84 396.474 135 493.974 218 548.974L304 411.974C258.5 380.974 235.5 343.974 230.5 298.474Z',
        'segment2': 'M288.5 172.974L218 51.474C130.5 113.974 91 186.474 85.5 286.974H230.5C232 232.974 254 200.474 288.5 172.974Z',
        'segment3': 'M297.5 165.974L227 44.974C321.5 -13.526 439.5 -12.5259 529.5 37.474L461 165.974C418.5 137.974 351.5 132.474 297.5 165.974Z',
        'segment4': 'M684 286.974C678 192.474 629 98.474 540 43.474L470 172.474C506.5 198.974 524.5 235.974 527 286.974H684Z',
        'segment5': 'M684 298.474H527C519.5 347.974 498 380.474 463 405.974L546 552.474C624.5 502.974 684 420.474 684 298.474Z'
    
    };

    return paths[segmentId];

}



//Similiar to the above function on getting the segment pahts, this one does the colors for each segment
//TODO: Adjust these colors to make ti more visually pleaseing and matching the final theme we decide on.
function getSegmentColor(segmentId) {

    const colors = {

        'segment1': 'rgba(255, 0, 0, 0.11)',  
        'segment2': 'rgba(255, 0, 0, 0.46)',  
        'segment3': 'rgba(255, 0, 0, 0.47)',  
        'segment4': 'rgba(255, 0, 0, 0.62)',  
        'segment5': 'rgba(255, 0, 0, 1)'  

    };

    return colors[segmentId];

}


/* Styling function for F and E letters, consider changing this if needed.
TODO: Might want to change the actual colors from freena nd red to just black*/
function styleLetters() {


    d3.selectAll('#f-letter-1, #f-letter-2, #f-letter-3')
        .transition()
        .duration(1000)
        .attr('stroke', '#000000ff')
        .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))'); //TODO: Possibly change this

    d3.selectAll('#e-letter-1, #e-letter-2, #e-letter-3, #e-letter-4')
        .transition()
        .duration(1000)
        .attr('stroke', '#000000ff')
        .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))');


}



/* Handling the network view for airlines stuff here */

function transitionToNetworkView(segmentData) {

    if (currentView === 'network') return; //make sure nothing to do if we already on network
    
    currentView = 'network';

    currentActiveNetwork = segmentData.id; //make sure we have the right country and its top 3 airines data.
    
    // console.log('Inside transition to network code for country:', segmentData.country); //checking for problems
    
    
    //TRANSITION HERE
    

    mainSvg.transition()
        .duration(150) 
        .style('opacity', 0)
        .on('end', function() {

            console.log('Fuel gauge fade out complete, creating network view'); // Debug log
            
            //make sure what is there before (fuel guage) is hidden so no weird overlap
            mainSvg.style('display', 'none');
            
            
            createNetworkView(segmentData);//handle the actual creation of network view here

        });


}

//TODO: Bug when going back from guage if I hover hte guage, it will be stuck if I also click it. Change  this
/* Netowrk view creation handled here */

function createNetworkView(segmentData) {
    
    const svgWidth = parseInt(mainSvg.attr('width'));
    const svgHeight = parseInt(mainSvg.attr('height'));
    
    //netowrk wrapper, needs to be same size as guage careful with any adjustements if you guys work with this part
    networkContainer = wrapperDiv.append('svg')
        .attr('class', 'network-view')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('viewBox', '-100 -100 940 918')
        .style('opacity', 0);
    
    
    //Return button to go back
    //Not sure of any good way to go about this other than a button since the fuel guage click gets us here
    //TODO: if there is a better idea could be worth editing this
    const returnButton = networkContainer.append('g')
        .attr('class', 'return-button')
        .style('cursor', 'pointer')
        .on('click', transitionBackToGauge);
    

    //Styling of the return button
    returnButton.append('rect')
        .attr('x', -80)
        .attr('y', -80)
        .attr('width', 80)
        .attr('height', 35)
        .attr('rx', 18)
        .style('fill', 'rgba(0, 0, 0, 0.2)')
        .style('stroke', '#000000ff')
        .style('stroke-width', 1);


    
    //return button text
    //TODO: adjust the padding make it nicer
    returnButton.append('text')
        .attr('x', -40)
        .attr('y', -58)
        .text('Back')
        .style('fill', '#000000ff')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'middle');

    d3.select('.fuel-gauge-subtitle').text(`Top 3 Airlines in ${segmentData.country} by Flights`);

    d3.select('.fuel-gauge-subtitle-2').text(`Hover airlines for details. Drag airlines around.`);
    
    //the way I decided this has the centralnode representing the country and acting as an anchro for the three airlines
    //this is the stuff for that central node
    const centerX = 370;
    const centerY = 300;
    const radius = 360;


    ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// /////
    //create each node, and the things required for it.
    const nodes = [

        //country node positionand info, this is the central node that acts as an anchor
        { 
            id: 'country', 
            name: segmentData.country, 
            type: 'country', 
            x: centerX, 
            y: centerY,
            fx: centerX,
            fy: centerY,
            segmentId: segmentData.id
        },


        //the three airline nodes that can be moved and interacted with around the central country node.
        ...segmentData.nodes.map((node, i) => {

            const angle = (i * 2 * Math.PI / 3) - Math.PI / 2; // Start at top, go clockwise

            return {

                //TODO: adjust this data as needed, right now it seems too cluttered 
                id: `airline_${i}`,
                name: node.name,
                type: node.type,
                rank: node.rank,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                info: getAirlineInfo(segmentData.country, node.name, node.type), 
                segmentId: segmentData.id 

            };

        })


    ];
    
    //the links for the force  layout between teh country and each airline
    const links = segmentData.nodes.map((_, i) => ({ 

        source: 'country', 
        target: `airline_${i}` 

    }));
    
    //force simulation for airlines
    forceSimulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-100))
        .force("link", d3.forceLink(links).id(d => d.id).distance(radius).strength(0.8)) 
        .force("collision", d3.forceCollide().radius(25))
        .force("center", d3.forceCenter(centerX, centerY).strength(0.1)); 

    
    //linkage
    const linkElements = networkContainer.selectAll('.network-link')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'network-link')
        .style('stroke', '#000000ff')
        .style('stroke-width', 3)
        .style('opacity', 0.8);
    
    //creation of each node element including the center country.
    const nodeElements = networkContainer.selectAll('.network-node')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'network-node')
        .attr('r', d => d.type === 'country' ? 40 : 20)
        .style('fill', d => d.type === 'country' ? '#585858ff' : getSegmentColor(d.segmentId))
        .style('stroke', '#000000ff')
        .style('stroke-width', 3)
        .style('cursor', d => d.type === 'country' ? 'default' : 'grab')//only airlines are draggable
        .on('mouseenter', function(event, d) {

            if (d.type !== 'country') {

                showAirlineTooltip(d, event);

            }

        })
        .on('mousemove', function(event, d) {

            if (d.type !== 'country') {

                updateAirlineTooltipPosition(event);

            }

        })
        .on('mouseleave', function(event, d) {

            if (d.type !== 'country') {

                hideAirlineTooltip();

            }

        })
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragging)
            .on("end", dragEnded));
    
    //labels for each node
    const labelElements = networkContainer.selectAll('.network-label')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'network-label')
        .text(d => d.name)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'middle')
        .style('font-size', d => d.type === 'country' ? '32px' : '24px')
        .style('font-weight', 'bold')
        .style('fill', '#000000ff')
        .style('pointer-events', 'none');
    
    //tick updating
    forceSimulation.on("tick", function() {

        linkElements.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
        nodeElements.attr("cx", d => d.x)
            .attr("cy", d => d.y);
        
        labelElements.attr("x", d => d.x)
            .attr("y", d => d.y + (d.type === 'country' ? 70 : 55));

    });
    
    networkContainer.transition()
        .duration(150)
        .style('opacity', 1)


}
 ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// ///// /////


//method to bring back the original guage viz
function transitionBackToGauge() {

    if (currentView === 'gauge') return;
    d3.select('.fuel-gauge-subtitle').text('2024 Air Transport Pollution Data (rounded to nearest million tonnes)');

    d3.select('.fuel-gauge-subtitle-2').text('Hover for details or Click for another view.');

    networkContainer.transition()
        .duration(150)
        .style('opacity', 0)
        .on('end', function() {

            //stop the network view simulation
            if (forceSimulation) {

                forceSimulation.stop();
                forceSimulation = null;

            }

            networkContainer.remove();
            networkContainer = null;


            
            //bring back the main fuel guage viz
            mainSvg.style('display', 'block')
                .style('opacity', 0)
                .transition()
                .duration(150)
                .style('opacity', 1);
            
            currentView = 'gauge';
            currentActiveNetwork = null;

        });

}

//airline information to be displayted in the tooltipo
//returns: description, fleet size for airline, and destination root information for now.
//TODO: Adjust data as needed
function getAirlineInfo(country, airlineName, type) {

    const airlineData = {

        'United States': {

            'American Airlines': { 

                fleet: '900+ aircraft',
                routes: '350+ destinations'

            },
            'Delta Air Lines': { 

                fleet: '800+ aircraft', 
                routes: '325+ destinations'

            },
            'United Air Lines': { 

                fleet: '850+ aircraft',
                routes: '340+ destinations'

            }

        },
        'China': {

            'China Southern Airlines': { 

                fleet: '650+ aircraft',
                routes: '200+ destinations'

            },
            'China Eastern Airlines': { 

                fleet: '600+ aircraft',
                routes: '180+ destinations'

            },
            'Air China': { 

                fleet: '400+ aircraft',
                routes: '150+ destinations'

            }

        },
        'United Kingdom': {

            'Ryanair': { 

                fleet: '500+ aircraft',
                routes: '230+ destinations'

            },
            'British Airways': { 

                fleet: '280+ aircraft',
                routes: '180+ destinations'

            },
            'easyJet': { 

                fleet: '350+ aircraft',
                routes: '150+ destinations'

            }

        },
        'UAE': {


            'Emirates': { 

           
                fleet: '270+ aircraft',
                routes: '150+ destinations'

            },
            'Etihad Airways': { 

                fleet: '80+ aircraft',
                routes: '70+ destinations'

            },
            'Air Arabia': { 

                fleet: '70+ aircraft',
                routes: '170+ destinations'

            }

        },
        'Turkey': {

            'Turkish Airlines': { 
                
                fleet: '400+ aircraft',
                routes: '300+ destinations'

            },
            'Pegasus Airlines': { 

                fleet: '100+ aircraft',
                routes: '130+ destinations'

            },
            'SunExpress': { 

                fleet: '80+ aircraft',
                routes: '90+ destinations'

            }

        }

    };
    
    return airlineData[country] && airlineData[country][airlineName] 
        ? airlineData[country][airlineName] 
        : { desc: 'Aviation operations', fleet: 'Various aircraft', routes: 'Multiple destinations' };

}



//here I handled the actual tooltip creation stuff for airline information
//TODO: Adjust data contained and styling as needed
function showAirlineTooltip(airlineData, event) {

    const tooltip = d3.select('#country-tooltip');
    
    tooltip.html(`
        <div class="airline-info">
            <h4>${airlineData.name}</h4>
            <p class="airline-rank"><strong>Rank:</strong> #${airlineData.rank}</p>
            <p class="airline-fleet"><strong>Fleet:</strong> ${airlineData.info.fleet}</p>
            <p class="airline-routes"><strong>Routes:</strong> ${airlineData.info.routes}</p>
        </div>
    `);
    
    tooltip.style('display', 'block');
    updateAirlineTooltipPosition(event);

}



//maintain smooth tooltip based on where the mouse is instead of static position
function updateAirlineTooltipPosition(event) {

    const tooltip = d3.select('#country-tooltip');
    
    // Position tooltip near mouse
    const x = event.clientX + 10;
    const y = event.clientY - 10;
    
    tooltip.style('left', x + 'px')
        .style('top', y + 'px');

}

//hide the airline tooltip
//TODO: 
function hideAirlineTooltip() {

    const tooltip = d3.select('#country-tooltip');
    tooltip.style('display', 'none');

}

//airline node drag stuff
//TODO: Adjust based on d3 chp 13 code suggestions.
function dragStarted(event, d) {

    if (d.type === 'country') return; //error prevention stuff, shouldnt do anything for country nodes
    if (!event.active) forceSimulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    hideAirlineTooltip(); 
    
}

function dragging(event, d) {

    if (d.type === 'country') return; 

    d.fx = event.x;
    d.fy = event.y;

    hideAirlineTooltip(); 

}

function dragEnded(event, d) {

    if (d.type === 'country') return; 
    if (!event.active) forceSimulation.alphaTarget(0);
    
    
    //remove any fixed position to keep the dragged part.
    d.fx = null;
    d.fy = null;

    hideAirlineTooltip(); 
    

}


/* Below is tooltip and other fuel guage country related stuff */

//country tooltip hover for fuel guage. Adjust this further to make changes on pollution data encoding.
//TODO: maybe think of population data? Or other things?
function showCountryInfo(data, event) {

    const tooltip = d3.select('#country-tooltip');
    
    //color scale visual parts
    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, d3.max(pollutionData, d => d.pollutionValue)]);
    
    const rankColor = getSegmentColor(data.id); //reuse segment color for rank indication
    
    tooltip.html(
        
        `
        <div class="country-info">
            <h4>${data.country}</h4>
            <p class="rank" style="color: white">Rank #${data.rank} in Air Transport Pollution</p>
            <p class="pollution">${data.pollution}</p>
            <div class="pollution-bar">
                <div class="pollution-fill" style="width: ${(data.pollutionValue / 210) * 100}%; background: red"></div>
            </div>
        </div>
    `
);
    
    tooltip.style('display', 'block');
    updateTooltipPosition(event);

}

//updating the tooltip position, used in the country part of the fuel guage.
function updateTooltipPosition(event) {

    const tooltip = d3.select('#country-tooltip');
    
    
    const x = event.clientX + 10; 
    const y = event.clientY - 10; 
    
    tooltip
        .style('left', x + 'px')
        .style('top', y + 'px');

}

//helper to hid the country info tooltip, use this stuff when moving to network or other views.
function hideCountryInfo() {

    const tooltip = d3.select('#country-tooltip');
    tooltip.style('display', 'none');

}


/* Highlight and unhighlight things need to be adjusted when merging with main code, right now it does little */

function highlightSegment(segment) {

    segment.transition()
        .duration(200)
        .style('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6))')
        .attr('stroke-width', '4');
        
}


function unhighlightSegment(segment) {

    segment.transition()
        .duration(200)
        .style('filter', 'none')
        .attr('stroke-width', '3');

}

//initialize on dom loadup, this has to be adjusted when merging code with the group
d3.select(document).on('DOMContentLoaded', function() {

    initFuelGaugeInteractivity();

});

