// This module manages the permissions of docs in Apostrophe.
//
// A new permissions model is coming in 3.x. For alpha 1, logged-in users
// can do anything, and the public can only view content.
//
// In 3.0 final, users will be subdivided into guests, contributors,
// editors and admins, in ascending order of privilege. In the final
// 3.0 model, guests can view "login required" pages, but have no other
// special privileges. Contributors can create drafts but cannot publish
// them alone. Editors can edit anything except user accounts, and admins
// can edit anything.

module.exports = {
  options: { alias: 'permission' },
  init(self, options) {
    self.permissionPattern = /^([^-]+)-(.*)$/;
    self.apos.migration.add('retire-published-field', async () => {
      await self.apos.migration.eachDoc({}, 5, async (doc) => {
        if (doc.published === true) {
          doc.visibility = 'public';
        } else if (doc.published === false) {
          doc.visibility = 'loginRequired';
        }
        delete doc.published;
        return self.apos.doc.db.replaceOne({
          _id: doc._id
        }, doc);
      });
    });
  },
  methods(self, options) {
    return {
      // Determines whether the active user can carry out the
      // action specified by `action` on the doc or type name
      // specified by `docOrType`. Returns true if the action
      // is permitted, false if not permitted.
      //
      // If `docOrType` is a doc, this method checks whether the user
      // can carry out the specified action on that particular doc. If it is
      // a string, this method checks whether the user can potentially carry out
      // the action on that doc type generally.
      //
      // If a permission is not specific to particular documents,
      // for instance `view-draft`, `docOrType` may be omitted.
      //
      // The doc passed need not already exist in the database.
      //
      // See also `criteria` which can be called to build a MongoDB
      // criteria object returning only documents on which the active user
      // can carry out the specified action.
      //
      can(req, action, docOrType) {
        if (req.user) {
          return true;
        }
        const manager = docOrType && (self.apos.doc.getManager(docOrType.type || docOrType));
        if (action === 'view') {
          if (manager.isAdminOnly()) {
            return false;
          } else if (((typeof docOrType) === 'object') && (docOrType.visibility !== 'public')) {
            return false;
          } else {
            return true;
          }
        } else {
          return false;
        }
      },

      // Returns a MongoDB criteria object that retrieves only documents
      // the user is allowed to perform `action` on.
      //
      // If a permission is not specific to particular documents,
      // for instance `view-draft`, `docOrType` may be omitted.

      criteria(req, action) {
        if (req.user) {
          // For now, users can do anything
          return {};
        }
        if (action !== 'view') {
          // Public can only view for now
          return {
            _id: 'thisIdWillNeverMatch'
          };
        }
        const restrictedTypes = Object.keys(self.apos.doc.managers).filter(name => self.apos.doc.getManager(name).isAdminOnly());
        return {
          visibility: 'public',
          type: {
            $nin: restrictedTypes
          }
        };
      },

      // For each object in the array, if the user is able to
      // carry out the specified action, a property is added
      // to the object. For instance, if the action is "edit",
      // each doc the user can edit gets a "._edit = true" property.
      //
      // Note the underscore.
      //
      // This is most often used when an array of objects the user
      // can view have been retrieved and we wish to know which ones
      // the user can also edit.

      annotate(req, action, objects) {
        const property = `_${action}`;
        for (const object of objects) {
          if (self.can(req, action, object)) {
            object[property] = true;
          }
        }
      }
    };
  }
};
