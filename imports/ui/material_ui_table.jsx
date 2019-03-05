// QLICKER
// Author: Jacob Huschilt
//
// material_ui_table.jsx: Component for displaying grades from a course

import React, { Component, PropTypes } from 'react'
import { createContainer } from 'meteor/react-meteor-data'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table'

class _MaterialUITable extends Component {

  render () {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <div className='container'>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderColumn>Assignment</TableHeaderColumn>
                <TableHeaderColumn>Grade</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody>

              <TableRow>
                <TableRowColumn>Overall Participation</TableRowColumn>
                <TableRowColumn>90</TableRowColumn>
              </TableRow>
            </TableBody>
          </Table>

        </div>
      </MuiThemeProvider>
    )
  }
}

// meteor reactive data container
export const MaterialUITable = createContainer((props) => {
  return {
    temp: props.temp
  }
}, _MaterialUITable)

_MaterialUITable.propTypes = {
  temp: PropTypes.string
}
