import * as d3 from 'd3';

const TimeKnots = {
  draw(id, events, options) {
    const cfg = {
      width: null, // No default width, just fills the SVG.
      height: 200, // set a default height.
      radius: 10,
      lineWidth: 4,
      color: '#999',
      background: '#FFF',
      dateFormat: '%Y/%m/%d %H:%M:%S',
      verticalLayout: false,
      showLabels: false,
      labelDateFormat: '%Y/%m/%d',
      labelFormat: label => `${label.name} <small>${label.date}</small>`,
      showTip: true,
      addNow: false,
      seriesColor: d3.scaleOrdinal(d3.schemeCategory10),
      dateDimension: true,
      onClick: null,
      onMouseover: null,
      onMouseout: null,
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
    const { width } = d3.select(id).node().getBoundingClientRect();
    if (cfg.width === null) {
      cfg.width = width;
    }
    const tip = d3.select(id)
      // Set the main element to position relative so the tip is positioned correctly.
      .style('position', 'relative')
      .append('div')
      .attr('class', 'timeline-tip')
      .style('opacity', 0)
      .style('position', 'absolute');

    const svg = d3.select(id)
      .append('svg')
      .style('width', '100%');
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

    // Margin is the offset for each point.
    margin = (d3.max(events.map(d => d.radius)) || cfg.radius) * 1.5 + cfg.lineWidth;

    // The step is how many pixels each time division is.
    step = (cfg.verticalLayout)
      ? ((cfg.height - 2 * margin) / (maxValue - minValue))
      : ((cfg.width - 2 * margin) / (maxValue - minValue));

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
        .style('fill', (d) => { if (d.color !== undefined) { return d.color; } return cfg.color; }).transition()
        .duration(100)
        .attr('r', (d) => { if (d.radius !== undefined) { return Math.floor(d.radius * 1.5); } return Math.floor(cfg.radius * 1.5); });
    }

    function deflateKnot(node) {
      d3.select(node)
        .style('fill', (d) => { if (d.background !== undefined) { return d.background; } return cfg.background; }).transition()
        .duration(100)
        .attr('r', (d) => { if (d.radius !== undefined) { return d.radius; } return cfg.radius; });
    }

    /**
     * Get the color defined in the node or use a color series.
     * @param {} node
     */
    function getColor(node) {
      if (node.color !== undefined) {
        return node.color;
      }
      if (node.series !== undefined) {
        if (series.indexOf(node.series) < 0) {
          series.push(node.series);
        }
        return cfg.seriesColor(series.indexOf(node.series));
      }
      return cfg.color;
    }

    function getCircleX(d) {
      if (cfg.verticalLayout) {
        return Math.floor(cfg.width / 2);
      }
      const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
      return Math.floor(step * (datum - minValue) + margin);
    }

    function getCircleY(d) {
      if (cfg.verticalLayout) {
        const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
        return Math.floor(step * (datum - minValue) + margin);
      }
      return Math.floor(cfg.height / 2);
    }

    svg.selectAll('line')
      .data(events).enter().append('line')
      .attr('class', 'timeline-line')
      .attr('x1', (d) => {
        let ret;
        if (cfg.verticalLayout) {
          ret = Math.floor(cfg.width / 2);
        } else {
          const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
          ret = Math.floor(step * (datum - minValue) + margin);
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
        if (cfg.verticalLayout) {
          const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
          ret = Math.floor(step * (datum - minValue)) + margin;
        } else {
          ret = Math.floor(cfg.height / 2);
        }
        linePrevious.y1 = ret;
        return ret;
      })
      .attr('y2', (d) => {
        if (linePrevious.y1 !== null) {
          return linePrevious.y1;
        }
        if (cfg.verticalLayout) {
          const datum = (cfg.dateDimension) ? new Date(d.date).getTime() : d.value;
          return Math.floor(step * (datum - minValue));
        }
        return Math.floor(cfg.height / 2);
      })
      .style('stroke', getColor)
      .style('stroke-width', cfg.lineWidth);

    svg.selectAll('circle')
      .data(events).enter()
      .append('circle')
      .attr('class', 'timeline-event')
      .attr('r', (d) => { if (d.radius !== undefined) { return d.radius; } return cfg.radius; })
      .style('stroke', getColor)
      .style('stroke-width', (d) => { if (d.lineWidth !== undefined) { return d.lineWidth; } return cfg.lineWidth; })
      .style('fill', (d) => { if (d.background !== undefined) { return d.background; } return cfg.background; })
      .attr('cy', getCircleY)
      .attr('cx', getCircleX)
      .on('mouseover', function (d) {
        let format;
        let datetime;
        let label;
        if (cfg.dateDimension) {
          format = d3.timeFormat(cfg.dateFormat);
          datetime = format(new Date(d.date));
          label = {
            name: d.name,
            date: datetime,
          };
        } else {
          label = {
            name: d.name,
            date: '',
          };
        }

        inflateKnot(this);

        if (cfg.showTip) {
          tip.html('');
          if (d.img !== undefined) {
            tip.append('img').attr('src', d.img);
          }
          tip.append('div').html(cfg.labelFormat(label));
          tip.transition()
            .duration(100)
            .style('opacity', 0.9);
        }

        if (typeof cfg.onMouseover === 'function') {
          cfg.onMouseover(d);
        }
      })
      .on('mouseout', function (d) {
        if (!d.selected) {
          deflateKnot(this);
        }

        if (cfg.showTip) {
          tip.transition()
            .duration(100)
            .style('opacity', 0);
        }

        if (typeof cfg.onMouseout === 'function') {
          cfg.onMouseout(d);
        }
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

    if (cfg.showLabels === true) {
      // Set up the labels
      svg.selectAll('text')
        .data(events)
        .enter()
        .append('text')
        .text(d => d.name)
        .each(function () {
          const bbox = this.getBBox();
          d3.select(this)
            .attr('x', d => getCircleX(d) - (bbox.width / 2))
            .attr('y', d => getCircleY(d) + bbox.height + margin);
        });
    }

    svg.on('mousemove', function () {
      const tipHeight = parseInt(tip.style('height').replace('px', ''), 10);
      const [mouseX, mouseY] = d3.mouse(this);
      return tip.style('top', `${mouseY - tipHeight - margin}px`).style('left', `${mouseX + (margin / 2)}px`);
    });
    svg.on('mouseout', () => tip.style('opacity', 0).style('top', '0px').style('left', '0px'));
  },
};

window.TimeKnots = TimeKnots;

export default TimeKnots;
