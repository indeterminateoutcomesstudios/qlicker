/* global confirm  */
// QLICKER
// Author: Enoch T <me@enocht.am>
//
// session.jsx: page for display a running session to student

import React, { Component } from 'react'
// import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { _ } from 'underscore'

import { Questions } from '../../../api/questions'
import { Sessions } from '../../../api/sessions'
import { QuestionDisplay } from '../../QuestionDisplay'

class _Session extends Component {

  constructor (props) {
    super(props)

    this.state = { submittingQuestion: false }

    if (this.props.user.hasRole('student')) Meteor.call('sessions.join', this.props.session._id, Meteor.userId())
  }

  render () {
    if (this.props.loading) return <div className='ql-subs-loading'>Loading</div>

    const status = this.props.session.status
    if (status !== 'running') {
      let statusMessage

      if (status === 'visible') statusMessage = 'This session has not started yet. You can keep this page open until your professor starts the session or check back soon.'
      if (status === 'done') {
        statusMessage = 'This session has finished'
        let user = Meteor.user()
        let cId = this.props.session.courseId
        if (user && !user.isInstructor(cId)) {
          // if it's an instructor, this is being shown as a second display, so dont't
          // go to the course page and show everyone the class list
          Router.go('/course/' + this.props.session.courseId)
        }
      }
      return <div className='ql-subs-loading'>{statusMessage}</div>
    }
    const session = this.props.session

    if( !session.quiz ){
      const current = this.props.session.currentQuestion
      const q = current ? this.props.questions[current] : null
      const questionDisplay = this.props.user.hasRole('professor')
        ? <QuestionDisplay question={q} readonly />
        : <QuestionDisplay question={q} />
      return (
        <div className='container ql-session-display'>
          { q ? questionDisplay : '' }
        </div>)
    }else{
      const qlist = session.questions
      let qCount = 0
      const qLength = qlist.length
      return( <div className='container ql-session-display'>
        {
          qlist.map( (qId) => {
            qCount += 1
            const q = this.props.questions[qId]
            const questionDisplay = this.props.user.hasRole('professor')
              ? <QuestionDisplay question={q} readonly />
              : <QuestionDisplay question={q} />
              return (
                <div key={"qlist_"+qId}>
                  <div className = 'ql-session-question-title'> Question: {qCount+"/"+qLength}</div>
                  { q ? questionDisplay : '' }
                </div>)
          })
        }
        </div>)

    }
  }

}

// meteor reactive data container
export const Session = createContainer((props) => {
  const handle = Meteor.subscribe('sessions.single', props.sessionId) &&
    Meteor.subscribe('questions.inSession', props.sessionId)

  const session = Sessions.find({ _id: props.sessionId }).fetch()[0]
  let user = Meteor.user()
  const questionsInSession = Questions.find({ _id: { $in: session.questions || [] } }).fetch()

  return {
    questions: _.indexBy(questionsInSession, '_id'), // question map
    user: user, // user object
    session: session, // session object
    loading: !handle.ready()
  }
}, _Session)
