// QLICKER
// Author: Enoch T <me@enocht.am>
//
// course.js: JS related to course collection

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

import { _ } from 'underscore'

import Helpers from './helpers.js'

// expected collection pattern
const coursePattern = {
  _id: Match.Maybe(Helpers.NEString), // mongo db id
  name: Helpers.NEString, // Information Technology Project (2016-17)
  deptCode: Helpers.NEString, // CISC
  courseNumber: Helpers.NEString, // 498
  section: Helpers.NEString, // 001
  owner: Helpers.NEString, // mongo db id reference
  enrollmentCode: Helpers.NEString,
  semester: Helpers.NEString, // F17, W16, S15, FW16 etc.
  createdAt: Date
}

// Create course class
const Course = function (doc) { _.extend(this, doc) }
_.extend(Course.prototype, {
  createCourseCode: function () {
    return this.deptCode + ' ' + this.courseNumber + ' - ' + this.section
  }
})

// Create course collection
export const Courses = new Mongo.Collection('courses',
  { transform: (doc) => { return new Course(doc) } }
)

// data publishing
if (Meteor.isServer) {
  Meteor.publish('courses', function () {
    if (this.userId) {
      const user = Meteor.users.findOne({ _id: this.userId })
      if (Meteor.userRoleGreater(user, 'professor')) {
        return Courses.find({ owner: this.userId })
      } else {
        const coursesArray = user.profile.courses || []
        return Courses.find({ _id: { $in: coursesArray } }, { fields: { students: false } })
      }
    } else {
      this.ready()
    }
  })
}

// course permissions helper
const profHasCoursePermission = (courseId) => {
  let courseOwner = Courses.findOne({ _id: courseId }).owner

  if (Meteor.userHasRole(Meteor.user(), 'admin') ||
      (Meteor.userHasRole(Meteor.user(), 'professor') && Meteor.userId() === courseOwner)) {
    return
  } else {
    throw new Meteor.Error('not-authorized')
  }
}

// data methods
Meteor.methods({

  'courses.insert' (course) {
    course.enrollmentCode = Helpers.RandomEnrollmentCode()

    check(course, coursePattern)
    if (!Meteor.userHasRole(Meteor.user(), 'admin') &&
      !Meteor.userHasRole(Meteor.user(), 'professor')) {
      throw new Meteor.Error('not-authorized')
    }

    course.deptCode = course.deptCode.toLowerCase()
    course.courseNumber = course.courseNumber.toLowerCase()
    course.semester = course.semester.toLowerCase()

    return Courses.insert(course)
  },

  'courses.delete' (courseId) {
    profHasCoursePermission(courseId)
    // TODO remove enrollments from students
    return Courses.remove({ _id: courseId })
  },

  'courses.regenerateCode' (courseId) {
    profHasCoursePermission(courseId)

    const enrollmentCode = Helpers.RandomEnrollmentCode()
    Courses.update({ _id: courseId }, {
      $set: {
        enrollmentCode: enrollmentCode
      }
    })

    return Courses.find({ _id: courseId }).fetch()
  },

  'courses.checkAndEnroll' (deptCode, courseNumber, enrollmentCode) {
    check(deptCode, Helpers.NEString)
    check(courseNumber, Helpers.NEString)
    check(enrollmentCode, Helpers.NEString)
    const c = Courses.findOne({
      deptCode: deptCode.toLowerCase(),
      courseNumber: courseNumber.toLowerCase(),
      enrollmentCode: enrollmentCode.toLowerCase()
    })

    if (c) {
      Meteor.users.update({ _id: Meteor.userId() }, { // TODO check status before returning
        $addToSet: { 'profile.courses': c._id }
      })
      Courses.update({ _id: c._id }, {
        $addToSet: { students: { studentUserId: Meteor.userId() } }
      })
      return c
    }
    return false
  },

  'courses.edit' (course) {
    check(course._id, Helpers.NEString)
    check(course, coursePattern)
    let courseId = course._id

    profHasCoursePermission(courseId)

    return Courses.update({ _id: courseId }, {
      $set: {
        name: course.name,
        deptCode: course.deptCode.toLowerCase(),
        courseNumber: course.courseNumber.toLowerCase(),
        section: course.section,
        semester: course.semester.toLowerCase(),
        owner: course.owner // this method used to change course owner
      }
    })
  },

  // course<=>user methods
  'courses.addStudent' (courseId, studentUserId) { // TODO enforce permission
    check(courseId, Helpers.MongoID)
    check(studentUserId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    Meteor.users.update({ _id: studentUserId }, {
      $addToSet: { 'profile.courses': courseId }
    })

    return Courses.update({ _id: courseId }, {
      $addToSet: { students: { studentUserId: studentUserId } }
    })
  },
  'courses.removeStudent' (courseId, studentUserId) {
    check(courseId, Helpers.MongoID)
    check(studentUserId, Helpers.MongoID)

    profHasCoursePermission(courseId)

    Meteor.users.update({ _id: studentUserId }, {
      $pull: { 'profile.courses': courseId }
    })
    return Courses.update({ _id: courseId }, {
      $pull: { students: { 'studentUserId': studentUserId } }
    })
  }/*,
  // course<=>session methods
  'courses.createSession' (courseId, sessionId) {

  },
  'courses.deleteSession' () {

  }
  */
}) // end Meteor.methods