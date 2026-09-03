import Map "mo:core/Map";
import Types "../types/files";

module {
  /// Converts an internal File record into its shared FileView.
  public func toView(file : Types.File) : Types.FileView {
    {
      id = file.id;
      originalFilename = file.originalFilename;
      storedFilename = file.storedFilename;
      fileSize = file.fileSize;
      mimeType = file.mimeType;
      sha256Hash = file.sha256Hash;
      uploadedAt = file.uploadedAt;
    };
  };

  /// Lists all files owned by the given principal.
  public func listOwned(owner : Principal, files : Map.Map<Types.FileId, Types.File>) : [Types.FileView] {
    files.entries()
      .map(func (_, f) = f)
      .filter(func f = f.owner == owner)
      .map(toView)
      .toArray();
  };

  /// Looks up a single file by id.
  public func getById(id : Types.FileId, files : Map.Map<Types.FileId, Types.File>) : ?Types.File {
    files.get(id);
  };

  /// Records a newly uploaded file's metadata.
  public func add(file : Types.File, files : Map.Map<Types.FileId, Types.File>) : () {
    files.add(file.id, file);
  };

  /// Removes a file's metadata by id.
  public func remove(id : Types.FileId, files : Map.Map<Types.FileId, Types.File>) : () {
    files.remove(id);
  };

  /// Lists every file's metadata (admin dashboard).
  public func listAllFiles(files : Map.Map<Types.FileId, Types.File>) : [Types.FileView] {
    files.entries().map(func (_, f) = f).map(toView).toArray();
  };
};
