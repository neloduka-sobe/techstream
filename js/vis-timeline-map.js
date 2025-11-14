function renderTimelineMap(sel,data){
  const el=d3.select(sel);el.selectAll('*').remove();
  const W=el.node().clientWidth||960,H=el.node().clientHeight||600;
  const svg=el.append('svg').attr('viewBox',[0,0,W,H]);
  svg.append('text').attr('x',W/2).attr('y',H/2)
    .attr('text-anchor','middle').attr('fill','#1e3a5f')
    .text('renderTimelineMap placeholder');
}