var React = require('react');
var ReactDOM = require('react-dom');
var $ = require("jquery");
var JSON = require("JSON");
var Curves = require("./curves");

function loadJSON(url, success) {
   $.ajax({
      url: url,
      dataType: 'json',
      cache: false,
      success: success,
      error: function() {
         console.log("Failure loading " + url);
      }
   });
}

function download(filename, data) {
   if (typeof(data) === "string") {
      var output = 'data:text/plain;charset=utf-8,' + encodeURIComponent(data);
   }
   else {
      var output = data.toDataURL();
   }

   var element = document.createElement('a');
   element.setAttribute('href', output);
   element.setAttribute('download', filename);

   element.style.display = 'none';
   document.body.appendChild(element);

   element.click();

   document.body.removeChild(element);
}

var Button2 = React.createClass({

   getInitialState: function() {
      return {hover: false};
   },

   componentDidMount: function() {
      var color = this.props.color;
      var pieces = color.split('(');
      color = pieces[0] + 'a(' + pieces[1];
      pieces = color.split(')');
      color = pieces[0] + ', 0.5)';
      this.hoverColor = color;
   },

   mouseIn: function() {
      this.setState({hover: true});
   },

   mouseOut: function() {
      this.setState({hover: false});
   },

   render: function() {
      var style = {};
      if (this.props.status == "selected") {
         style.backgroundColor = this.props.color;
      }
      else if (this.state.hover) {
         var color = this.props.color;
         style.backgroundColor = this.hoverColor;
      }

      return (
         <button
            type="button"
            className={this.props.status}
            style={style}
            onMouseOver={this.mouseIn}
            onMouseOut={this.mouseOut}
            onClick={this.props.onClick} >
               {this.props.children}
         </button>
      );
   }
});

var ButtonPanel = React.createClass({

   handleClick: function(k) {
      this.props.onClick(this.props.idx, k);
   },

   render: function() {
      var buttons = new Array(this.props.k)
      for (var i=0; i<this.props.k; i++) {
         if (this.props.selected == i) {
            var state = "selected";
         }
         else {
            var state = "unselected";
         }
         buttons[i] = (
            <Button2
               key={i}
               idx={i}
               status={state}
               color={this.props.colors[i]}
               onClick={this.handleClick.bind(null, i)} >
                  {i}
            </Button2>
         );
      }

      if (this.props.namePos === "right") {
         return (
            <div className="ButtonPanel clearfix">
               <div className="RightButtons">{buttons}</div>
               <div className="RightLabel">{this.props.name}</div>
            </div>
         );
      }
      else {
         return (
            <div className="ButtonPanel clearfix">
               <span className="LeftLabel">{this.props.name}</span>
               <div className="LeftButtons">{buttons}</div>
            </div>
         );
      }

   }
});

var ButtonBank = React.createClass({

   handleClick: function(panel, k) {
      var panelID = this.props.n*this.props.idx + panel;
      this.props.onClick(panelID, k);
   },

   render: function() {
      var elements = new Array(this.props.n)
      for (var i=0; i<this.props.n; i++) {
         elements[i] = (
            <ButtonPanel
               key={i}
               idx={i}
               k={this.props.k}
               colors={this.props.colors}
               name={this.props.names[i]}
               namePos={this.props.namePos}
               selected={this.props.selections[i]}
               onClick={this.handleClick}
            />
         );
      }
      return (
         <div className="ButtonBank">
            {elements}
         </div>
      );
   }
});

var DropDown = React.createClass({

   getInitialState: function() {
      return {active: false};
   },

   switch: function() {
      this.setState({active: !this.state.active});
   },

   render: function() {
      if (this.state.active) {
         var status = " DropDownActive";
      }
      else {
         var status = "";
      }

      return (
         <div className="DropDown">
            <button type="button"
               className={"DropDownHead"+status}
               onClick={this.switch}
            >
               {this.props.text}
            </button>
            <div className={"DropDownInside"+status}>
               {this.props.children}
            </div>
         </div>
      );
   }
});

var Shapes = React.createClass({

   draw: function() {
      var colors = this.props.selections.map(function(s) {
         return s+1;
      });
      colors.unshift(0);
      this.props.shapes.draw(this.refs.canvas, colors);
   },

   componentDidMount: function() {
      this.draw();
   },

   componentDidUpdate: function() {
      this.draw();
   },

   render: function() {
      if(this.props.shapes !== null) {
         var size = this.props.shapes.getShape();
         var w = size[0];
         var h = size[1];
      }
      else {
         var w = 0;
         var h = 0;
      }
      var r = window.devicePixelRatio;
      return (
         <canvas ref="canvas"
            height={r*h}
            width={r*w}
            style={{height: h, width: w}}
         />
      );
   }

});

var ColorBar = React.createClass({

   render: function() {
      colors = [];
      labels = [];
      for (var i=0; i<this.props.colors.length; i++) {
         var color = this.props.colors[i];
         colors.push((
            <div
               className="ColorBlock Col"
               key={i}
               style={{backgroundColor: color}}
            />
         ));
         labels.push((
            <div
               className="LabelBlock Col"
               key={i+this.props.colors.length}>
               {i}
            </div>
         ));
      }
      return (
         <div className="ColorBar Table">
            <div className="Row">
               {colors}
            </div>
            <div className="Row">
               {labels}
            </div>
         </div>
      );
   }

});

var MainView = React.createClass({

   getInitialState: function() {
      return({shapes: null, names: null});
   },

   handleClick: function(n, k) {
      var selections = this.props.selections;
      if (selections[n] == k) {
         selections[n] = -1;
      }
      else {
         selections[n] = k;
      }
      this.props.setSelections(selections);
   },

   fullStrength: function() {
      var selections = this.props.selections;
      for (var i=0; i<selections.length; i++) {
         if (selections[i] == -1) {
            selections[i] = this.props.config.k-1;
         }
      }
      this.props.setSelections(selections);
   },

   clearAll: function() {
      var selections = [];
      for (var i=0; i<this.props.config.n; i++) {
         selections.push(-1);
      }
      this.props.setSelections(selections);
   },

   saveImage: function() {
      var filename = prompt("filename:", "image.png");
      if (filename === null) {
         return;
      }
      var canvas = document.getElementsByTagName("canvas")[0];
      download(filename, canvas);
   },

   componentDidMount: function() {

      // load muscle shapes
      loadJSON(this.props.shapes, (function(data) {
         var shapes = new Curves(data, this.props.config.colorMap);
         shapes.reshape({dx: this.props.config.dxBody,
                         dy: this.props.config.dyBody,
                         h:this.props.config.bodyHeight});
         this.setState({shapes: shapes});
      }).bind(this));

      // load muscle names
      loadJSON(this.props.names, (function(data) {
         this.setState({names: data});
      }).bind(this));
   },

   render: function() {
      if (this.props.view !== "main" || this.state.shapes === null || this.state.names === null) {
         return (<div/>);
      }
      var colorMap = this.props.config.colorMap.slice(1);
      return (
         <div className="App Table">

            <div className="Row">

               <div className="Col">
                  <ButtonBank
                     n={this.props.config.n/2}
                     k={this.props.config.k}
                     selections={this.props.selections.slice(0, this.props.config.n/2)}
                     names={this.state.names}
                     colors={colorMap}
                     namePos="left"
                     onClick={this.handleClick}
                     idx={0}
                  />
                  <div className="Bottom">

                     <DropDown text="options">

                        <button
                           type="button"
                           className="DropDownElement"
                           onClick={this.props.toAnnotate}
                        >
                           annotate
                        </button>
                        <br/>
                        <button
                           type="button"
                           className="DropDownElement"
                           onClick={this.saveImage}
                        >
                           export image
                        </button>
                        <br/>
                        <button
                           type="button"
                           className="DropDownElement"
                           onClick={this.props.saveData}
                        >
                           save
                        </button>
                        <br/>
                        <button
                           type="button"
                           className="DropDownElement"
                           onClick={this.props.loadData}
                        >
                           load
                        </button>

                     </DropDown>

                  </div>
               </div>

               <div className="Col" id="CenterCol">
                  <Shapes
                     shapes={this.state.shapes}
                     selections={this.props.selections}
                  />
               </div>


               <div className="Col">
                  <ButtonBank
                     n={this.props.config.n/2}
                     k={this.props.config.k}
                     colors={colorMap}
                     selections={this.props.selections.slice(this.props.config.n/2)}
                     names={this.state.names}
                     namePos="right"
                     onClick={this.handleClick}
                     idx={1}
                  />
                  <div className="Bottom">

                     <button
                        type="button"
                        className="Button Col"
                        onClick={this.clearAll}
                     >
                        clear all
                     </button>

                     <button
                        type="button"
                        className="Button Col"
                        onClick={this.fullStrength}
                     >
                        full strength
                     </button>

                     <br/>

                     <ColorBar colors={colorMap} />

                     <div className="Table">
                        <div className="Row">
                           <div className="Annotation Col">
                              {this.props.data.name}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      );
   }

});

var AnnotateView = React.createClass({

   render: function() {
      if (this.props.view !== "annotate") {
         return (<div/>);
      }
      return (
         <div>
            <div className="Table">
               <div className="Row">
                  <div className="InputText Col">name:</div>
                  <div className="InputText Col">age:</div>
                  <div className="InputText Col">sex:</div>
                  <div className="InputText Col">date:</div>
               </div>

               <div className="Row">
                  <div className="Col">
                     <input
                        type="text"
                        className="Input"
                        id="Name"
                        value={this.props.data.name}
                        onChange={this.props.onChange("name")}
                     />
                  </div>

                  <div className="Col">
                     <input
                        type="text"
                        className="Input"
                        id="Age"
                        value={this.props.data.age}
                        onChange={this.props.onChange("age")}
                     />
                  </div>

                  <div className="Col">
                     <input
                        type="text"
                        className="Input"
                        id="Sex"
                        value={this.props.data.sex}
                        onChange={this.props.onChange("sex")}
                     />
                  </div>

                  <div className="Col">
                     <input
                        type="text"
                        className="Input"
                        id="Date"
                        value={this.props.data.date}
                        onChange={this.props.onChange("date")}
                     />
                  </div>
               </div>
            </div>

            <div className="Table">
               <div className="Row">
                  <div className="InputText Col">diagnosis:</div>
               </div>

               <div className="Row">
                  <div className="Col">
                     <input
                        type="text"
                        className="Input"
                        id="Diagnosis"
                        value={this.props.data.diagnosis}
                        onChange={this.props.onChange("diagnosis")}
                     />
                  </div>
               </div>
            </div>

            <div className="Table">
               <div className="Row">
                  <div className="InputText Col">notes:</div>
               </div>

               <div className="Row">
                  <textarea
                     rows="10"
                     className="InputBox"
                     id="Notes"
                     value={this.props.data.notes}
                     onChange={this.props.onChange("notes")}
                  />
               </div>

               <div className="Row">
                  <button
                     type="button"
                     className="Button"
                     id="ToMain"
                     onClick={this.props.toMain}
                  >
                     confirm
                  </button>
               </div>
            </div>
         </div>
      );
   }

});

var App = React.createClass({

   getInitialState: function() {
      var data = {name: '', age: '', sex: '', date: '',
                  diagnosis: '', notes: ''};
      return {view: "main", data: data, config: null, selections: null};
   },

   componentDidMount: function() {
      // load application configuration parameters
      loadJSON(this.props.config, (function(data) {
         var selections = [];
         for (var i=0; i<data.n; i++) {
            selections.push(-1);
         }
         this.setState({config: data, selections: selections});
      }).bind(this));
   },

   setSelections(selections) {
      this.setState({selections: selections});
   },

   handleDataChange: function(variable) {
      var handler = function(e) {
         var data = this.state.data;
         data[variable] = e.target.value;
         this.setState({data: data});
      }
      return handler.bind(this);
   },

   toAnnotate: function() {
      this.setState({view: "annotate"});
   },

   toMain: function() {
      this.setState({view: "main"});
   },

   save: function() {
      var filename = prompt("filename:", "data.json");
      if (filename === null) {
         return;
      }
      var allData = {}
      allData.data = this.state.data;
      allData.selections = this.state.selections;
      download(filename, JSON.stringify(allData, null, '\t'));
   },

   load: function() {
      this.refs.fileSelector.click();
   },

   handleLoad: function() {
      var file = this.refs.fileSelector.files[0];
      var reader = new FileReader;
      reader.onload = (function (e) {
         var data = JSON.parse(e.target.result);
         this.setState(data);
      }).bind(this);
      reader.readAsText(file);
   },

   render: function() {
      if (this.state.config == null) {
         return(<div/>);
      }
      return (
         <div>
            <MainView
               shapes={this.props.shapes}
               names={this.props.names}
               config={this.state.config}
               selections={this.state.selections}
               setSelections={this.setSelections}
               data={this.state.data}
               view={this.state.view}
               toAnnotate={this.toAnnotate}
               saveData={this.save}
               loadData={this.load}
            />
            <AnnotateView
               view={this.state.view}
               data={this.state.data}
               onChange={this.handleDataChange}
               toMain={this.toMain}
            />
            <input
               type="file"
               ref="fileSelector"
               style={{display: "none"}}
               onChange={this.handleLoad}
            />
         </div>
      );
   }

});

ReactDOM.render(
   <App shapes="./shapes.json" names="./names.json" config="./config.json"/>,
   document.getElementById('content')
);
