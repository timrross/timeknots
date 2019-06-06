/* global d3 */

const TimeKnots = {
  draw(id, events, options) {
    const cfg = {
      width: 600,
      height: 200,
      radius: 10,
      lineWidth: 4,
      color: '#999',
      background: '#FFF',
      dateFormat: '%Y/%m/%d %H:%M:%S',
      horizontalLayout: true,
      showLabels: false,
      labelFormat: '%Y/%m/%d %H:%M:%S',
      addNow: false,
      seriesColor: d3.scaleOrdinal(d3.schemeCategory10),
      dateDimension: true,
      onClick: null,
    };

    let timestamps;
    let minValue;
    let maxValue;
    let margin;
    let step;

    // default configuration override
    if (options !== undefined) {
      Object.assign(cfg, options);
    }
    if (cfg.addNow !== false) {
      events.push({ date: new Date(), name: cfg.addNowLabel || 'Today' });
    }
    const tip = d3.select(id)
      .append('div')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('font-family', 'Helvetica Neue')
      .style('font-weight', '300')
      .style('background', 'rgba(0,0,0,0.5)')
      .style('color', 'white')
      .style('padding', '5px 10px 5px 10px')
      .style('-moz-border-radius', '8px 8px')
      .style('border-radius', '8px 8px');
    const svg = d3.select(id).append('svg').attr('width', cfg.width).attr('height', cfg.height);
    // Calculate times in terms of timestamps
    if (!cfg.dateDimension) {
      timestamps = events.map(d => d.value); // new Date(d.date).getTime()});
      maxValue = d3.max(timestamps);
      minValue = d3.min(timestamps);
    } else {
      timestamps = events.map(d => Date.parse(d.date)); // new Date(d.date).getTime()});
      maxValue = d3.max(timestamps);
      minValue = d3.min(timestamps);
    }
    margin = (d3.max(events.map(d => d.radius)) || cfg.radius) * 1.5 + cfg.lineWidth;
    step = (cfg.horizontalLayout) ? ((cfg.width - 2 * margin) / (maxValue - minValue))
      : ((cfg.height - 2 * margin) / (maxValue - minValue));
    const series = [];
    if (maxValue === minValue) {
      step = 0;
      if (cfg.horizontalLayout) {
        margin = cfg.width / 2;
      } else {
        margin = cfg.height / 2;
      }
    }

    const linePrevious = {
      x1: null,
      x2: null,
      y1: null,
      y2: null,
    };

    function inflateKnot(node) {
      d3.select(node)
        .style('fill', (data) => { if (data.color !== undefined) { return data.color; } return cfg.color; }).transition()
        .duration(100)
        .attr('r', (data) => { if (data.radius !== undefined) { return Math.floor(data.radius * 1.5); } return Math.floor(cfg.radius * 1.5); });
    }

    function deflateKnot(node) {
      d3.select(node)
        .style('fill', (data) => { if (data.background !== undefined) { return data.background; } return cfg.background; }).transition()
        .duration(100)
        .attr('r', (data) => { if (data.radius !== undefined) { return data.radius; } return cfg.radius; });
    }

    svg.selectAll('line')
      .data(events).enter().append('line')
      .attr('class', 'timeline-line')
      .attr('x1', (d) => {
        let ret;
        if (cfg.horizontalLayout) {
          const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
          ret = Math.floor(step * (datum - minValue) + margin);
        } else {
          ret = Math.floor(cfg.width / 2);
        }
        linePrevious.x1 = ret;
        return ret;
      })
      .attr('x2', () => {
        if (linePrevious.x1 != null) {
          return linePrevious.x1;
        }
        return Math.floor(cfg.width / 2);
      })
      .attr('y1', (d) => {
        let ret;
        if (cfg.horizontalLayout) {
          ret = Math.floor(cfg.height / 2);
        } else {
          const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
          ret = Math.floor(step * (datum - minValue)) + margin;
        }
        linePrevious.y1 = ret;
        return ret;
      })
      .attr('y2', (d) => {
        if (linePrevious.y1 !== null) {
          return linePrevious.y1;
        }
        if (cfg.horizontalLayout) {
          return Math.floor(cfg.height / 2);
        }
        const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
        return Math.floor(step * (datum - minValue));
      })
      .style('stroke', (d) => {
        if (d.color !== undefined) {
          return d.color;
        }
        if (d.series !== undefined) {
          if (series.indexOf(d.series) < 0) {
            series.push(d.series);
          }
          return cfg.seriesColor(series.indexOf(d.series));
        }
        return cfg.color;
      })
      .style('stroke-width', cfg.lineWidth);

    svg.selectAll('circle')
      .data(events).enter()
      .append('circle')
      .attr('class', 'timeline-event')
      .attr('r', (d) => { if (d.radius !== undefined) { return d.radius; } return cfg.radius; })
      .style('stroke', (d) => {
        if (d.color !== undefined) {
          return d.color;
        }
        if (d.series !== undefined) {
          if (series.indexOf(d.series) < 0) {
            series.push(d.series);
          }
          return cfg.seriesColor(series.indexOf(d.series));
        }
        return cfg.color;
      })
      .style('stroke-width', (d) => { if (d.lineWidth !== undefined) { return d.lineWidth; } return cfg.lineWidth; })
      .style('fill', (d) => { if (d.background !== undefined) { return d.background; } return cfg.background; })
      .attr('cy', (d) => {
        if (cfg.horizontalLayout) {
          return Math.floor(cfg.height / 2);
        }
        const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
        return Math.floor(step * (datum - minValue) + margin);
      })
      .attr('cx', (d) => {
        if (cfg.horizontalLayout) {
          const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
          const x = Math.floor(step * (datum - minValue) + margin);
          return x;
        }
        return Math.floor(cfg.width / 2);
      })
      .on('mouseover', function (d) {
        let format; let datetime; let
          dateValue;
        if (cfg.dateDimension) {
          format = d3.timeFormat(cfg.dateFormat);
          datetime = format(new Date(d.date));
          dateValue = (datetime !== '') ? (`${d.name} <small>(${datetime})</small>`) : d.name;
        } else {
          datetime = d.value;
          dateValue = `${d.name} <small>(${d.value})</small>`;
        }

        inflateKnot(this);

        tip.html('');
        if (d.img !== undefined) {
          tip.append('img').style('float', 'left').style('margin-right', '4px').attr('src', d.img)
            .attr('width', '64px');
        }
        tip.append('div').style('float', 'left').html(dateValue);
        tip.transition()
          .duration(100)
          .style('opacity', 0.9);
      })
      .on('mouseout', function (d) {
        if (!d.selected) {
          deflateKnot(this);
        }
        tip.transition()
          .duration(100)
          .style('opacity', 0);
      })
      .on('click', (d) => {
        if (typeof cfg.onClick === 'function') {
          cfg.onClick(d);
        }
      })
      .each(function (d) {
        if (d.selected) {
          inflateKnot(this);
        }
      });

    let format;
    let startString;
    let endString;
    // Adding start and end labels
    if (cfg.showLabels !== false) {
      if (cfg.dateDimension) {
        format = d3.timeFormat(cfg.labelFormat);
        startString = format(new Date(minValue));
        endString = format(new Date(maxValue));
      } else {
        startString = minValue;
        endString = maxValue;
      }
      svg.append('text')
        .text(startString).style('font-size', '70%')
        .attr('x', function getX() { if (cfg.horizontalLayout) { return d3.max([0, (margin - this.getBBox().width / 2)]); } return Math.floor(this.getBBox().width / 2); })
        .attr('y', function getY() { if (cfg.horizontalLayout) { return Math.floor(cfg.height / 2 + (margin + this.getBBox().height)); } return margin + this.getBBox().height / 2; });

      svg.append('text')
        .text(endString).style('font-size', '70%')
        .attr('x', function getX() { if (cfg.horizontalLayout) { return cfg.width - d3.max([this.getBBox().width, (margin + this.getBBox().width / 2)]); } return Math.floor(this.getBBox().width / 2); })
        .attr('y', function getY() { if (cfg.horizontalLayout) { return Math.floor(cfg.height / 2 + (margin + this.getBBox().height)); } return cfg.height - margin + this.getBBox().height / 2; });
    }

    svg.on('mousemove', () => {
      const tipPixels = parseInt(tip.style('height').replace('px', ''), 10);
      return tip.style('top', `${d3.event.pageY - tipPixels - margin}px`).style('left', `${d3.event.pageX + 20}px`);
    });
    svg.on('mouseout', () => tip.style('opacity', 0).style('top', '0px').style('left', '0px'));
  },
};

window.TimeKnots = TimeKnots;

export default TimeKnots;
