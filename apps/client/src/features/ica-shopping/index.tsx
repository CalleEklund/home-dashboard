import { useIcaAuth } from "./hooks/useIcaAuth";
import { useIcaLists } from "./hooks/useIcaLists";
import { QrScanView, LoginStartView } from "./views/LoginView";
import { ListPickerView } from "./views/ListPickerView";
import { ShoppingListView } from "./views/ShoppingListView";

export default function IcaShopping() {
  const auth = useIcaAuth();
  const listState = useIcaLists(auth.authenticated, auth.setUnauthenticated, auth.setError);

  const handleLogout = async () => {
    await auth.handleLogout();
    listState.clearOnLogout();
  };

  if (auth.authenticated === null) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#6c7086]">
        Connecting...
      </div>
    );
  }

  if (!auth.authenticated && auth.qrCode) {
    return <QrScanView qrCode={auth.qrCode} error={auth.error} onCancel={auth.cancelLogin} />;
  }

  if (!auth.authenticated) {
    return <LoginStartView starting={auth.starting} error={auth.error} onStart={auth.startLogin} />;
  }

  if (listState.showListPicker || !listState.selectedListId) {
    return (
      <ListPickerView
        lists={listState.lists}
        error={auth.error}
        onSelect={listState.selectList}
        onDelete={listState.deleteList}
        onCreate={listState.createList}
        onLogout={handleLogout}
      />
    );
  }

  if (!listState.activeList) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#6c7086]">
        Loading...
      </div>
    );
  }

  return (
    <ShoppingListView
      activeList={listState.activeList}
      lastFetched={listState.lastFetched}
      error={auth.error}
      onAddItem={listState.addItem}
      onRemoveItem={listState.removeItem}
      onShowPicker={() => listState.setShowListPicker(true)}
    />
  );
}
