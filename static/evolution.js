function merge_arrays(a, b) {
  if (a.len != b.len)
    return null;

  let res = [];
  for (i in a) {
    res.push(a[i] + b[i]);
  }
  return res;
}

function convert_date(d) {
  if (d.length != 8)
    return null;

  let dstr = d.slice(0,4) + "-" + d.slice(4,6) + "-" + d.slice(6);
  
  return new Date(parseInt(d.slice(0,4)),
                  parseInt(d.slice(4,6))-1,
                  parseInt(d.slice(6)));
}

function merge_evolutions(ev) {
  // First group by date and sum up.
  let bydate = {};
  let temp = 0;
  for (version in ev) {
    ev[version][""]["data"].forEach(function(histogram) {
      if (histogram.date == '20170312') {
        temp += histogram.histogram[3];
      }
      if (!bydate[histogram.date]) {
        bydate[histogram.date] = histogram.histogram;
      } else {
        mm = merge_arrays(bydate[histogram.date],
                          histogram.histogram);
        bydate[histogram.date] = mm;
      }
    });
  }

  console.log(temp);
  console.log(bydate['20170312']);
  
  for (d in bydate) {
    let s = d3.sum(bydate[d]);
    for (i in bydate[d]) {
      bydate[d][i] = bydate[d][i]/s;
    }
  }
  
  // Now we need to invert into a dictionary keyed by histogram key.
  let res = [];
  let dates = Object.keys(bydate).sort();
  
  for (i in dates) {
    let date = dates[i];
    for (j in bydate[date]) {
      k = j.toString();
      if (!res[k]) {
        res[k] = [];
      }
      let to_add = {'date':convert_date(date), 'value':bydate[date][k]}; 
      if ((k === "3") && (date == '20170412')) {
        console.log(to_add);
      }
      res[k].push(to_add);
    }
  }


  for (k in res) {
    res[k].sort(function(a,b) {
      return a.date.getTime() - b.date.getTime();
    })
  }

  console.log(res[3]);
  return res;
}

function trim_dates_evolution(evolution, first_date) {
    for (i in evolution) {
        if (evolution[i].date >= first_date) {
            return evolution.slice(i);
        }
    }
    return null;
}

function trim_dates_evolutions(evolutions, first_date) {
    ret = []
    for (e in evolutions) {
        ret[e] = trim_dates_evolution(evolutions[e], first_date);
    }
    return ret;
}

function render_evolution(spec) {
    console.log("Rendering " + JSON.stringify(spec));
    d3.json('data/' +
            spec.histogram + '/' +
            spec.channel, function(data) {
                data = merge_evolutions(data);
                data = trim_dates_evolutions(data,
                                             new Date(Date.now() -
                                                      spec.days * 86400 * 1000));
                
                let to_graph = [];
                let labels = []
                for (k in spec.values) {
                    to_graph.push(data[k]);
                    labels.push(spec.values[k]);
                }
                MG.data_graphic({
                    title : spec.title,
                    data : to_graph,
                    width : 1200,
                    height: 800,
                    x_accessor: 'date',
                    y_accessor: 'value',
                    show_rollover_text: false,
                    legend: labels,
                    legend_target: "#legend"
                });
            });
}
